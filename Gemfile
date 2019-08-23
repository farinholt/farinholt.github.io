source 'https://rubygems.org'

group :jekyll_plugins do
    gem "jekyll-feed"
    gem "json"
    gem "hash-joiner"
    gem 'jekyll'
    gem 'jekyll-email-protect'
    gem 'jekyll-paginate'
    gem 'jekyll-scholar'
    gem 'jemoji'
    gem 'unicode_utils'
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
install_if -> { RUBY_PLATFORM =~ %r!mingw|mswin|java! } do
  gem "tzinfo", "~> 1.2"
  gem "tzinfo-data"
end

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.0", :install_if => Gem.win_platform?
