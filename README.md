# probot-report-error

This library allows [probot](https://github.com/probot/probot) bots to report an error by creating an Issue on the affected repository. If an Issue with the same title exists but is closed, it will be reopened.

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


---

(these are notes from building this package)

# Design Notes

## Initialization Options

- [x] pass the context as an arg: `require('probot-report-error').reportIssue(context, {title, body})`
- [ ] allow a way to either wrap code in a `try { } catch (err)` or listen to promise.reject
- [ ] support wrapping the config retrieval. Something like `await reporter.getConfigOrReportError(context, filename, (err) => {title, body})`
- Show examples using robot.config() as well as `probot-config` 's `getConfig()` (which parses the file)
- [ ] attach a method on probot : `require('probot-report-error')(robot); robot.reportIssue(context, {title, body})`

## Workflow

Example:

```js
const reporter = require('probot-report-error')

robot.on('issues.opened', async ({context}) => {
  let config
  try {
    config = await context.config('stale.yml')
  } catch (err) {
    return reporter.reportIssue(context, {
      title: 'Error while checking for stale issues',
      body: `An error occurred while trying to check this repository for stale issues.
\`\`\`
${err.message}
\`\`\`

Check the syntax of `.github / stale.yml` and make sure it's valid. For more information or questions, see [probot/stale](https://github.com/probot/stale)
`
    })
  }
})
```


## What should the code do?

1. check if there is an Issue with the `title`
1. If so, check if it is closed
  1. If so, reopen the issue and add a comment
1. Otherwise, create a new Issue

#### Notes

Look at https://github.com/behaviorbot/new-issue-welcome/blob/master/index.js for searching through Issues.

https://developer.github.com/v3/issues/#list-issues-for-a-repository does not let you filter by title. So we need https://developer.github.com/v3/search/#search-issues . To limit to the repository: https://help.github.com/articles/searching-issues-and-pull-requests/#search-within-a-users-or-organizations-repositories

May need to cache this information because searches have a lower rate limit.

Another approach could be to add a label to the Issue... then we filter on the label. but that is out-of-scope for now.


## Pseudocode

```js
async function reportIssue (context, {title, body}) {
  // Search for all Issues in the repo that match the title
  const query = `repo:${repoOwner}/${repoName} type:issue in:title ${title}` // TODO: Should we reopen a closed issue? Probably. `state:open`
  const {data: issues} = await context.github.search.issues({q: query, sort: 'updated', order: 'desc'})
  const issue = issues[0]

  // If we found it and it is open, then do nothing (TODO: Should we add a comment so people are emailed?)
  if (issue) {
    // TODO: Discuss whether to just check if the issue is closed (and reopen it)
    switch (issue.state) {
      case 'open':
        break
      case 'closed':
        // Reopen the Issue and add a comment
        await context.github.issues.edit(context.repo({number: issue.number, state: 'open', body}))
        return context.github.issues.createComment(context.repo({number: issue.number, body}))
      default:
        throw new Error(`BUG: Invalid Issue state '${issue.state}'`)
    }
  } else {
    // Create a new Issue
    return context.github.issues.create(context.repo({ title, body }))
  }
}
```


# Challenges

- there is no good way to filter Issues by title (so I used `github.search.issue(...)`)
- probot lacks a quick way to record API requests (so I added `fetch-vcr`)
