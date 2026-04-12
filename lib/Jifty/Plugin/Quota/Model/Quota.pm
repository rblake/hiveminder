package Jifty::Plugin::Quota::Model::Quota;
sub new                { bless {}, shift }
sub load_by_object     { }
sub load_by_cols       { }
sub create_from_object { }
sub id                 { undef }
sub maximum            { 0 }
sub used               { 0 }
sub _value             { undef }
1;
