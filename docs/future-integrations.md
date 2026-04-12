# Future Integrations

## Bot / Messaging Integrations

The original Hiveminder had AIM, Jabber, and Twitter bot transports. These were removed because
the underlying libraries (Net::OSCAR, Net::Jabber, Net::Twitter::Lite) are unmaintained and
non-functional on modern Perl. The Twitter page crashed on load.

**The bot command framework is intact and ready to be reused.**

`BTDT::IM::Command::*` contains a full set of task management commands (create, done, search,
due, give, tag, priority, etc.) that operate on Hiveminder tasks via a simple text protocol.
Any new transport only needs to implement the interface in `BTDT::IM` — parse incoming text,
dispatch to the command handlers, return the response string.

### Planned transports

- **Slack** — implement as a Slack app (slash commands or bot user via the Events API).
  Map incoming messages to `BTDT::IM::Command` dispatch. OAuth token per user to associate
  Slack identity with Hiveminder account.

- **Discord** — similar to Slack; Discord bot via the Discord API. Per-user token linkage
  or a shared bot with user identification by Discord user ID.

- **Bluesky** — AT Protocol. Could work as mention-based (user @-mentions the bot with a
  command) or DM-based. Requires an AT Protocol client library for Perl or a small sidecar
  service in another language that posts to the Hiveminder API.

### Removed files

The following were deleted and are not in git history going forward:

- `lib/BTDT/IM/AIM.pm` — AIM transport (Net::OSCAR)
- `lib/BTDT/IM/Jabber.pm` — Jabber transport (Net::Jabber)
- `lib/BTDT/IM/LocalJabber.pm` — local Jabber variant
- `lib/BTDT/IM/TwitterREST.pm` — Twitter transport (Net::Twitter::Lite)
- `lib/BTDT/Action/TwitterFollow.pm` — Twitter follow action
- `lib/BTDT/Notification/LaunchTwitter.pm` — Twitter notification
- `lib/BTDT/View/Pingdom.pm` — Pingdom monitoring view (also used Net::OSCAR/Net::Jabber)
- `lib/DJabberd/Bot/Hiveminder.pm` — DJabberd bot entry point
