> **Warning:** This project is under active development. Unannounced breaking changes to the protocol and APIs should be expected.

## dev-events

dev-events is a protocol specification, and a set of applications implementing
those services, for the publishing and consumption of IDE events over an MQTT
bus.

The reason for doing this is to decouple the event-collection from the events'
uses - and even placing the consumer on a different machine than the producer.
This allows the following things:

* Collecting your own self-hosted personal IDE usage statistics.
* Only needing a small plugin to provide complex functionality.
* Avoiding writing multiple plugins per-IDE for unrelated uses of the events
* Avoiding writing plugins for multiple IDEs for the same use of events from
  different IDEs
* Work-safe plugin for not-safe-for-work purposes.

Additionally, because of the choice of MQTT as the transfer mechanism, we allow
direct integration with existing automation software such as home-assistant
for e.g. flashing the room red when a test run fails.

## Getting Started

* Provision yourself an MQTT broker accessible to the machine your IDE is on
* Install and configure a producer plugin
* Wire something up at the other end to consume it.
  Some services will be made available in my other repos (see the roadmap!)
  But for things such as home-assistant, it is up to you to figure it out :)
  The message format is described in [MESSAGE-FORMAT.md](MESSAGE-FORMAT.md)

## Roadmap

As projects are started they will gain links, and as they reach a reasonable
level of feature-completeness and battle-testedness, they will be checked off.

Producers:

* [ ] [Jetbrains plugin](https://github.com/madrigal-eschat/dev-events-jetbrains-publisher)
  * [ ] Publishes to marketplace
* [ ] VSCode plugin
  * [ ] Publishes to extension library thing I dunno I don't use VSCode much

* [ ] CI bridge
  * [ ] Github
  * [ ] Gitlab
  * [ ] Bitbucket
  * [ ] Circle CI
  * [ ] Travis? Do people still use travis?
  * [ ] Codemagic

Consumers:

* [ ] [Haptic feedback bridge](https://github.com/madrigal-eschat/dev-events-haptics-bridge) with pluggable backends
  * [ ] [buttplug.io](https://buttplug.io/) API v4 backend
* [ ] home-assistant bridge
  * [ ] Example home-assistant configurations for controlling lights
  * [ ] Example home-assistant configurations for collecting stats
* [ ] Redaction consumer - republishes messages received to a new topic, where
      the new messages are stripped of identifying information.

In terms of a rough ordering: The Jetbrains plugin and haptic feedback bridge
come first, then I'll work on CI bridges.

## Contributing

For now, until the protocol is stabilised and some dogfooding's done, I suggest
you save your ideas and don't try to join in.

I'll publish a license for all this at some point. Insofar as is practical
I'll be using Apache 2.0
