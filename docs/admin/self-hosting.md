# Self Hosting

This app can be self-hosted with some work.

## Creating a Firebase project

::: warning
This project needs to be on the pay-as-you-go Blaze plan
:::

Create a Firebase project and add Firestore, auth, functions, and Storage. Add a web app to get a config and replace the Firebase config in [`src/lib/firebase.ts`](https://github.com/HarryAllen1/tsa-grouping-thing/blob/main/src/lib/firebase.ts) with this config.

## Setting up Firestore

Globally install the Firebase CLI (`firebase-tools` package) with whatever package manager you normally use. Run `firebase login` and do all the things to connect this project with your existing one. Run `firebase deploy` to initialize all the functions and Firestore/Storage rules.

In your Firestore database, create the following collections:

- `events`: All teams are stored here
- `mail`: All request emails are stored here
- `settings`: Stores settings here. Create a single document `settings` here with the fields:
  - `alert` (`string`)
  - `enableOnlineSubmissions` (`boolean`)
  - `lockAccounts` (`boolean`)
- `users`: Contains all accounts and their events.

Then, go to the Extensions tab and install the [Trigger Email from Firestore extension](https://extensions.dev/extensions/firebase/firestore-send-email). Set that up with an email (Gmail makes it work pretty nicely).

## Setting up Authentication

Currently, this app uses email link login and Microsoft login. Enable both of those in the dashboard, following the appropriate instructions for each method. If you don't want to use these, you will have to modify some of the code in [`src/routes/Login.svelte`](https://github.com/HarryAllen1/tsa-grouping-thing/blob/main/src/routes/Login.svelte).

::: details Why those two methods?
Initially, Microsoft since that was initially easiest. However, LWSD did something which broke new users from signing up with Microsoft, so I added email link.
:::

Go to Settings -> Authorized domains and add all of the domains you will be using.

## Fixing up the app

Look for instances of contact info and the `lwsd.org` domain and the `jhstsa.org` domain and change those to whatever you're doing. The app should work. I'm not sure if it actually will though, since I've never actually ever tried using this guide.
