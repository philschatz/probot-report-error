# probot-report-error

This library allows [probot](https://github.com/probot/probot) bots to report an error by creating an Issue on the affected repository. If an Issue with the same title exists but is closed, it will be reopened.

See the TODO section below and the [design notes](./notes.md) for notes and challenges implementing this bot.

# Usage

There are two ways to use this library:

- Report an Error when the config file cannot be parsed
- Report an Error at any point

### Report an Error when the config file cannot be parsed

Instead of writing `config = await context.config('config.yml')`,
run `config = await getConfigOrReportError(context, 'config.yml', messageFn)`
where `messageFn` is a function that takes the `Error` that occurred and returns
a `{title, body}` object which contains the text that will be used for the Issue
title and body.

**Example:**

```js
const {getConfigOrReportError} = require('probot-report-error')

robot.on('push', async (context) => {

  // Replace context.config('config.yml') with the following:
  const config = await getConfigOrReportError(context, 'config.yml', (err) => {
    // This is the handler that generates the message which is used when creating the Issue
    return {
      title: 'The Configuration file for barista-bot is invalid',
      body: `An error occurred while trying to read the configuration for barista-bot.
\`\`\`
${err.message}
\`\`\`

Check the syntax of \`.github/config.yml\` and make sure it's valid. For more information or questions, see [philschatz/barista-bot](https://github.com/philschatz/barista-bot)
`
    }
  })
})
```


### Report an Error at any point

Not all errors occur while parsing the YAML file. To report any errors `reportIssue` can be used.

**Example:**

```js
const {reportIssue} = require('probot-report-error')

robot.on('push', async (context) => {
  // ...
  if (!coffeeShop) {
    await reportIssue(context, {
      title: 'Barista-bot validation failed',
      body: 'Missing coffeeShop preference in config.yml file'
    })
  }
})
```


# Development

To run the tests with a debugger, run `npm run-script test-debug`. Make sure you add a `debugger` statement in the code.

To re-record the fixtures, see [./test/_fixtures/README.md](./test/_fixtures/README.md)

---

# TODO

- [x] [design](./notes.md) what the API looks like
- [x] add test framework and sanity test
- [x] add `reportIssue` (with tests)
- [x] add `getConfigOrReportError` (with tests)
- [x] write documentation
- [x] move design notes into a separate md file
- [x] validate input
- [ ] add travis and codecov
- [ ] test with an examplebot
- [ ] clean up the design notes
- [ ] switch to TypeScript
