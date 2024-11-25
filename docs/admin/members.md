<script setup>
  import { MIN_EVENTS } from '../../src/lib/constants'
</script>

# Members

The [members page](https://teaming.jhstsa.org/admin/members) is a useful tool to organize members. This page is used for:

- Quickly looking at a member's events
- Getting a member's information (t-shirt size, gender, etc.)
- Modifying a member's information
- Registering member's for the January Qualifier and State conference

## Random Switch

This switch can be used for whatever you like -- use it for keeping track of who you registered, who paid their fees, or whatever else.

## Names

When a user initially creates an account, they will be prompted with an intake form.

![intake form](intake-form.png)

The first three fields ask for the user's first, last, and preferred first name. The first and last name should **always** match what is in Skyward. This is what is used to keep track of which members have paid, so any deviation from Skyward will lead to confusion.

The preferred name always overrides the user's Skyward first name in the case of National affiliation as TSA doesn't care what people's actual names are.

When names are shown back to users (like in teams), the format, if there is a preferred name is `Preferred (Skyward) Last`.

## Member Page View Formats

There are two ways to view information on the members page:

### Grid

This is the view you should be using 99% of the time. You can see emails and whatnot here as well as modify user information. Click the user cog icon in the top right of each user to modify more obscure information, such as the user ID, name, and preferred name.

### List

Data will be formatted in a table, with each member assigned a row. Only the info needed for January Qualifier/State registration is shown. This view makes it easier to keep track of who you have registered and not much else.

Edit member details through the ellipsis on the right.

## Displaying Events

In the list view, events are always shown. In the grid view, at the bottom of each member card, there is a collapsible (with the up/down arrows).

![event expansion](event-expansion.png)

If the button is red, the user is under the {{ MIN_EVENTS }} event limit. You should talk to that person at some point to bring them up to {{ MIN_EVENTS }}.
If the button is orange, the user has {{ MIN_EVENTS }} events, but doesn't have teams for all of those events. You should talk to that person so that they have teams for at least {{ MIN_EVENTS }} events.
If the button is yellow, the user has enough teams and events, but doesn't have teams for all of their events.

Upon viewing events, the format is as follows:

```txt
[event name] ([team number] [👑 if team captain])
```

If you need to use the grid view and need to view everyone's events, at the top of the page, click the "Expand all events" button. This will have the equivalent effect of manually expanding everyone's events.

![expand all events](expand-all-events.png)
