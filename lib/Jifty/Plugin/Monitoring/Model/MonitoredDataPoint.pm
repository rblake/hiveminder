package Jifty::Plugin::Monitoring::Model::MonitoredDataPoint;
use base 'Jifty::DBI::Record';
sub table { '_monitoring_data_points' }
sub new   { bless {}, shift }
1;
