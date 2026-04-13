# Hiveminder Docker Build
# Build context is the repo root; docker-compose.yml sets context: ..
# No git clone needed — source is COPY'd from the local checkout.
#
# Build and run (from repo root):
#   docker compose -f docker/docker-compose.yml up
#
# Local development override (sets HM_BASE_URL to localhost):
#   docker compose -f docker/docker-compose.yml -f docker/docker-compose.local.yml up

# ---- PWA build stage ----
FROM node:20-slim AS pwa-builder
COPY pwa /pwa
WORKDIR /pwa
RUN npm ci && npm run build

# ---- Main app stage ----
FROM perl:slim

# System dependencies for Hiveminder / Jifty
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Build tools
    build-essential \
    gcc \
    make \
    wget \
    curl \
    ca-certificates \
    git \
    # Postgres client lib (for DBD::Pg compilation)
    libpq-dev \
    postgresql-client \
    # SSL / crypto
    libssl-dev \
    # XML/HTML processing
    libxml2-dev \
    libxslt1-dev \
    expat \
    libexpat1-dev \
    # Image processing (used by some Jifty plugins)
    libgd-dev \
    libjpeg-dev \
    libpng-dev \
    # Other libs
    zlib1g-dev \
    libyaml-dev \
    # Misc
    netcat-openbsd \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Create hmperl symlink (Hiveminder checks for this in Makefile.PL)
RUN ln -sf /usr/local/bin/perl /usr/local/bin/hmperl

# ------------------------------------------------------------------
# Install CPAN modules
# Order matters: core build chain first, then Jifty, then Hiveminder deps
# ------------------------------------------------------------------

# Core build infrastructure
RUN cpanm --notest \
    ExtUtils::MakeMaker \
    Module::Install \
    Module::Build

# DBI + pinned DBD::Pg 3.2.1 (3.3.0+ breaks Unicode compat with Jifty::DBI)
RUN cpanm --notest DBI
RUN cpanm --notest \
    https://cpan.metacpan.org/authors/id/T/TU/TURNSTEP/DBD-Pg-3.2.1.tar.gz

# Jifty framework (pinned versions per README)
RUN cpanm --notest \
    YAML::Syck \
    YAML \
    JSON \
    JSON::XS \
    Clone \
    Scalar::Util \
    List::Util \
    List::MoreUtils \
    Storable \
    File::Spec \
    File::Find \
    File::Path \
    File::Copy \
    File::Slurp \
    Cwd

RUN cpanm --notest \
    Class::Accessor \
    Class::Accessor::Fast \
    Class::Data::Inheritable \
    Class::ISA \
    Class::Trigger \
    UNIVERSAL::require \
    UNIVERSAL::isa

RUN cpanm --notest \
    HTML::Mason \
    HTML::Entities \
    HTML::Parser \
    HTML::Tree \
    HTML::Scrubber \
    HTML::TokeParser

RUN cpanm --notest \
    Template \
    Template::Declare \
    Template::Timer

RUN cpanm --notest \
    CGI \
    CGI::Cookie \
    HTTP::Server::Simple \
    HTTP::Server::Simple::CGI

RUN cpanm --notest \
    Email::Simple \
    Email::Address \
    https://cpan.metacpan.org/authors/id/M/MA/MARKOV/MIME-Types-2.09.tar.gz \
    Email::MIME \
    Email::MIME::Creator \
    Email::LocalDelivery \
    Mail::Address
RUN wget -q -O /tmp/Email-Send-2.201.tar.gz \
    https://cpan.metacpan.org/authors/id/R/RJ/RJBS/Email-Send-2.201.tar.gz \
    && cpanm --notest --force /tmp/Email-Send-2.201.tar.gz || true

RUN cpanm --notest \
    XML::Simple \
    XML::Writer \
    XML::SAX \
    XML::Parser

RUN cpanm --notest \
    Locale::Maketext \
    Locale::Maketext::Lexicon \
    Locale::Maketext::Simple \
    Locale::Codes

RUN cpanm --notest \
    DateTime \
    DateTime::Format::Natural \
    DateTime::Format::ISO8601 \
    DateTime::Locale \
    DateTime::TimeZone

RUN cpanm --notest --force \
    Crypt::CBC \
    Digest::MD5 \
    Digest::SHA \
    MIME::Base64
# Crypt::DES XS fails to compile on modern Perl — try, but don't break the build
RUN cpanm --notest --force Crypt::DES || true

RUN cpanm --notest \
    Cache::Cache \
    Cache::FastMmap \
    IPC::ShareLite

RUN cpanm --notest \
    Net::SMTP \
    Net::POP3 \
    LWP::UserAgent \
    LWP::Protocol::https \
    URI \
    URI::QueryParam

# Jifty and Jifty::DBI (pinned)
# Pre-populate cpanm's local CPAN index so module-name lookups work
# when the cpanmetadb API is unreachable (fallback path)
RUN mkdir -p '/root/.cpanm/sources/http%www.cpan.org' \
    && wget -q -O '/root/.cpanm/sources/http%www.cpan.org/02packages.details.txt.gz' \
    http://www.cpan.org/modules/02packages.details.txt.gz

# Install Jifty-DBI 0.78 and all its deps via wget + explicit ordered install
RUN cd /tmp && wget -q \
    https://cpan.metacpan.org/authors/id/L/LE/LEEJO/String-CRC32-2.100.tar.gz \
    https://cpan.metacpan.org/authors/id/R/RC/RCLAMP/Class-Accessor-Chained-0.01.tar.gz \
    https://cpan.metacpan.org/authors/id/H/HE/HERMES/Clone-Choose-0.010.tar.gz \
    https://cpan.metacpan.org/authors/id/D/DA/DAGOLDEN/Class-InsideOut-1.14.tar.gz \
    https://cpan.metacpan.org/authors/id/I/IV/IVAN/DBIx-DBSchema-0.47.tar.gz \
    https://cpan.metacpan.org/authors/id/J/JE/JESSE/Class-ReturnValue-0.55.tar.gz \
    https://cpan.metacpan.org/authors/id/J/JE/JESSE/Scalar-Defer-0.23.tar.gz \
    https://cpan.metacpan.org/authors/id/D/DO/DORMANDO/Cache-Memcached-1.30.tar.gz \
    https://cpan.metacpan.org/authors/id/D/DC/DCONWAY/Lingua-EN-Inflect-1.905.tar.gz \
    https://cpan.metacpan.org/authors/id/S/SH/SHLOMIF/Object-Declare-0.25.tar.gz \
    https://cpan.metacpan.org/authors/id/J/JE/JESSE/Cache-Simple-TimedExpiry-0.27.tar.gz \
    https://cpan.metacpan.org/authors/id/N/NE/NEILB/Time-Duration-Parse-0.16.tar.gz \
    https://cpan.metacpan.org/authors/id/N/NE/NEILB/Exporter-Lite-0.09.tar.gz \
    https://cpan.metacpan.org/authors/id/R/RE/REHSACK/Hash-Merge-0.200.tar.gz \
    https://cpan.metacpan.org/authors/id/N/NE/NEILB/Time-Duration-1.21.tar.gz \
    https://cpan.metacpan.org/authors/id/E/ET/ETHER/Data-Page-2.03.tar.gz \
    https://cpan.metacpan.org/authors/id/I/IS/ISHIGAKI/DBD-SQLite-1.78.tar.gz \
    https://cpan.metacpan.org/authors/id/A/AL/ALEXMV/Jifty-DBI-0.78.tar.gz \
    && cpanm --notest \
    /tmp/String-CRC32-2.100.tar.gz \
    /tmp/Class-Accessor-Chained-0.01.tar.gz \
    /tmp/Clone-Choose-0.010.tar.gz \
    /tmp/Class-InsideOut-1.14.tar.gz \
    /tmp/DBIx-DBSchema-0.47.tar.gz \
    /tmp/Class-ReturnValue-0.55.tar.gz \
    /tmp/Exporter-Lite-0.09.tar.gz \
    /tmp/Scalar-Defer-0.23.tar.gz \
    /tmp/Cache-Memcached-1.30.tar.gz \
    /tmp/Lingua-EN-Inflect-1.905.tar.gz \
    /tmp/Object-Declare-0.25.tar.gz \
    /tmp/Cache-Simple-TimedExpiry-0.27.tar.gz \
    /tmp/Time-Duration-Parse-0.16.tar.gz \
    /tmp/Hash-Merge-0.200.tar.gz \
    /tmp/Time-Duration-1.21.tar.gz \
    /tmp/Data-Page-2.03.tar.gz \
    /tmp/DBD-SQLite-1.78.tar.gz \
    /tmp/Jifty-DBI-0.78.tar.gz

# Pre-install Jifty's tricky deps.
# Mouse and IO::Socket::IP pins were only needed for Perl 5.12 — removed.
# Moose and Plack version pins also removed; install current.
RUN cd /tmp && wget -q \
    https://cpan.metacpan.org/authors/id/E/ET/ETHER/Moose-2.1404.tar.gz \
    https://cpan.metacpan.org/authors/id/M/MI/MIYAGAWA/Plack-1.0034.tar.gz \
    https://cpan.metacpan.org/authors/id/R/RJ/RJBS/Email-Send-2.201.tar.gz \
    https://cpan.metacpan.org/authors/id/V/VA/VANSTYN/Email-MIME-CreateHTML-1.041.tar.gz \
    && cpanm --notest --mirror https://cpan.metacpan.org --mirror-only \
    /tmp/Moose-2.1404.tar.gz \
    Mouse \
    Any::Moose \
    /tmp/Plack-1.0034.tar.gz \
    /tmp/Email-Send-2.201.tar.gz \
    /tmp/Email-MIME-CreateHTML-1.041.tar.gz

RUN wget -q -O /tmp/Jifty-1.50430.tar.gz \
    https://cpan.metacpan.org/authors/id/A/AL/ALEXMV/Jifty-1.50430.tar.gz \
    && cpanm --notest --force --mirror https://cpan.metacpan.org --mirror-only /tmp/Jifty-1.50430.tar.gz

# Patch escape_utf8 to fix 8x form field/link duplication.
# Root cause: s/// with no matches doesn't write back to the lvalue, so
# overloaded objects persist through all 7 substitutions, triggering
# render() (= output to buffer) 7 times + once more in buffer->append = 8x.
# Fix: force a single stringify before the s/// operations.
COPY docker/patches/fix-escape-utf8.pl /tmp/patches/fix-escape-utf8.pl
RUN perl /tmp/patches/fix-escape-utf8.pl

# Jifty's dep resolution can upgrade Hash::Merge to 0.300+ which broke the
# class-level specify_behavior API that Jifty::Param::Schema relies on.
# Force-reinstall 0.200 (REHSACK, 2013-11-03) as the final word on this module.
RUN wget -q -O /tmp/Hash-Merge-0.200.tar.gz \
    https://cpan.metacpan.org/authors/id/R/RE/REHSACK/Hash-Merge-0.200.tar.gz \
    && cpanm --notest /tmp/Hash-Merge-0.200.tar.gz

# Hiveminder-specific deps
RUN cpanm --notest --mirror https://cpan.metacpan.org --mirror-only \
    Data::Plist \
    Text::WikiFormat \
    Text::Markdown \
    Text::Password::Pronounceable \
    Text::CSV \
    Text::Textile \
    Regexp::Common \
    Number::RecordLocator \
    Calendar::Simple \
    Date::ICal \
    iCal::Parser

RUN cpanm --notest --mirror https://cpan.metacpan.org --mirror-only \
    WWW::Mechanize \
    HTTP::Cookies \
    HTTP::Request::Common

# Jifty plugins required by Hiveminder (not bundled with Jifty itself)
# Monitoring and Quota are Best Practical internal — not on CPAN, omitted from config
RUN cpanm --notest --mirror https://cpan.metacpan.org --mirror-only \
    Jifty::Plugin::AccessLog

# ------------------------------------------------------------------
# Copy Hiveminder source
# ------------------------------------------------------------------
WORKDIR /opt/hiveminder
COPY . .

# Install Hiveminder's own Perl deps via its Makefile.PL
# (notest because many tests require a live DB or network)
RUN perl Makefile.PL \
    && cpanm --notest --mirror https://cpan.metacpan.org --mirror-only --installdeps . \
    || true

# Create log and mason cache directories
RUN mkdir -p /opt/hiveminder/log /opt/hiveminder/var/mason

# Jifty's default TemplateRoot is share/web/templates and static root is
# share/web/static, but Hiveminder stores templates in html/ and statics in
# static/. Create symlinks so Jifty's defaults resolve correctly.
RUN mkdir -p /opt/hiveminder/share/web \
    && ln -sf /opt/hiveminder/html    /opt/hiveminder/share/web/templates \
    && ln -sf /opt/hiveminder/static  /opt/hiveminder/share/web/static

# Copy built PWA into Jifty's static root — served at /app/ with no Apache needed
COPY --from=pwa-builder /pwa/dist /opt/hiveminder/static/app

# Copy in our config and entrypoint (overrides anything in repo's etc/)
COPY docker/config/hiveminder.yml /opt/hiveminder/etc/config.yml
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Activate local-mode patches (pro accounts for all, no email)
ENV HM_LOCAL_MODE=1
ENV HM_NO_EMAIL=1

EXPOSE 8888

WORKDIR /opt/hiveminder

ENTRYPOINT ["/entrypoint.sh"]
