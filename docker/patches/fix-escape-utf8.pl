#!/usr/bin/env perl
# fix-escape-utf8.pl
#
# Patches Jifty::View::Mason::Handler::escape_utf8 to force-stringify
# overloaded objects before performing regex substitutions.
#
# ROOT CAUSE OF 8x DUPLICATION BUG:
#   Mason's default_escape_flags => 'h' causes all <% expr %> values to go
#   through apply_escapes($val, 'h') -> escape_utf8(\$val). escape_utf8 does
#   seven s/// operations on $$ref.
#
#   When $$ref is an overloaded object (Jifty::Web::Form::Field or
#   Jifty::Web::Form::Link), each s/// triggers the "" stringify overload,
#   which calls render() as a side effect — writing HTML to the Jifty buffer.
#
#   KEY PERL BEHAVIOR: when s/// finds NO MATCHES (render() returns "",
#   so there are no "&", "<", etc. to replace), Perl does NOT write back to
#   the lvalue. So $$ref remains the overloaded object after each s///,
#   causing render() to fire again on the next substitution.
#
#   Result: render() fires 7 times (once per s///) + 1 time in
#   buffer->append via the .= concatenation in $m->print = 8x total.
#
# THE FIX:
#   Add $$ref = "$$ref" if ref($$ref) at the top of escape_utf8.
#   This force-stringifies the object exactly once (calling render() once,
#   writing HTML to the buffer once), then stores the return value ("") back
#   into $$ref. Subsequent s/// operations on the plain "" string are no-ops,
#   and apply_escapes returns "" so $m->print("") is a no-op.

use strict;
use warnings;

use Config;
my $file = $Config{sitelib} . '/Jifty/View/Mason/Handler.pm';

open my $fh, '<', $file or die "Cannot read $file: $!";
my $content = do { local $/; <$fh> };
close $fh;

my $old = qr{
    sub \s+ escape_utf8 \s* \{ \s*
    my \s+ \$ref \s* = \s* shift; \s*
    no \s+ warnings \s+ ['"]uninitialized['"]; \s*
}x;

unless ($content =~ $old) {
    # Already patched or different version — check
    if ($content =~ /Force stringify/) {
        print "escape_utf8 already patched, skipping.\n";
        exit 0;
    }
    die "Could not find expected escape_utf8 body in $file — cannot patch.\n";
}

(my $new_func = <<'NEWFUNC') =~ s/\A\n//;

sub escape_utf8 {
    my $ref = shift;
    # Force stringify before regex operations. Overloaded objects (e.g.
    # Jifty::Web::Form::Field/Link) have a "" overload that writes to the
    # Jifty buffer as a side effect. Without this, s/// with no matches
    # leaves $$ref as the original overloaded object, causing render() to
    # fire once per s/// (7 times) plus once in buffer->append = 8x output.
    $$ref = "$$ref" if ref($$ref);
    no warnings 'uninitialized';
NEWFUNC

$content =~ s{
    sub \s+ escape_utf8 \s* \{ \s*
    my \s+ \$ref \s* = \s* shift; \s*
    no \s+ warnings \s+ ['"]uninitialized['"]; \s*
}{$new_func}x
    or die "Substitution failed unexpectedly.\n";

open my $out, '>', $file or die "Cannot write $file: $!";
print $out $content;
close $out;

print "Patched escape_utf8 in $file\n";
