# Teams

The admin teams page is fundamentally the same as the member teams page, except admin's can view all teams in all events, and admins can change every aspect of every team and every event.

## Team colour coding

Teams are colour coded to assist in finding teams that might need adjusting or communicating with.

If a team is red, the team is either underfilled or overfilled. If the team is underfilled, the team should be talked to so that the minimum team size can be hit. If it is too big, then something happened that shouldn't have. Communicate with the team to remove the necessary amount of people.

If a team is green, the team is exactly at the event limit.

If a team has no colour, it is in the middle: not at the event limit, but not underfilled either.

## Naming

The names of events are largely whatever the event name is. However, as there is no way to manually order the events, as the events are sorted alphabetically, if you want to have an event be at the top, you will have to prefix it with a letter that has a [character code](https://www.ascii-code.com/) which is smaller than all of the other events' first character (in other words, if you want an event to be at the top, prefix it with a "\*").

## Editing events

Events can be edited by pressing the cog icon to the right of the event name. Doing so will bring up a dialog which will allow you to edit the event.

### Editing event settings

The event settings are toggles that change how members interact with the event. When changed, these toggles will save automatically (you don't need to press the save button at the bottom and can just close the dialog).

Here is how each setting works:

#### Auto-signup everyone

When enabled, all users will automatically be added to this event. It will still appear in the "Change Events" page and member can still sign up for it. This is useful for rooming and cardboard boat, where, when those are needed, members will be signed up so they can create rooms/teams. This should often be used in conjunction with the "Hide in signup page" option.

In rooming, this option wil appear as "Enable Rooming." It functions identically (under the hood, it is actually the same option, just with a different label).

#### Hide in signup page

When this option is enabled, members will no longer be visible in the "Change Events" page. If a member is already signed up for this event and this option is enabled, they will be stuck in this event and an admin will have to manually remove the event. This toggle should be used in conjunction with the "Auto-signup everyone" option for events like rooming and cardboard boat.

#### Lock event

When an event is locked, it will still appear in the "Change events" page, however, it will be greyed out. Members will no longer be able to add/remove the event, and teams cannot be created or changed. Requests can also no longer be made.

This is useful for eliminations. After an elimination is complete, the event can be locked so that registration is easier.

#### Lock team creation when full

This option still allows members to signup/remove this event. However, teams can only be created when the event is not full. When the event has saturated its teams, teams can still be edited.

This is useful for eliminations. After eliminations are complete and people need to hit their minimum event limit, this can be enabled so that people can change their events without causing additional eliminations.

#### Lock team creation

This is the same as above, except teams can no longer be created, even if the event's teams are unsaturated.

#### Online submissions

This toggle allows members to submit files for submissions, typically used for eliminations. See [submissions](./submissions.md) for more information.

### Event Details

These are non-boolean options about the event. After editing, all changes to this section require explicit saving through the "Save" button at the bottom of the dialog. This differs from the toggles as I don't want every keypress to update the database as I get charged of there are too many requests.

#### Event name

The name of the event... what else?

#### Event description

The description is placed directly beneath the event name after a member has signed up for the event. This is useful if there is a special case happening for an elimination (like for coding and tech bowl where the teams are determined by a test).

#### Min team size

The minimum size of a team. Teams can be underneath this limit, but the card will appear as red. Cards that are red should be fixed before registration.

#### Max team size

The number of members in a team cannot exceed this limit.

#### Max teams per chapter

The number of teams that can be created. This has no effect until the "lock team creation when full" toggle is selected, beyond information about the event.
