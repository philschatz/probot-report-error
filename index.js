async function reportIssue (context, {title, body}) {
  // Validate the input
  // TODO: Decide whether to validate that the title and body are strings and are not too short
  if (!title) {
    throw new Error('BUG: Empty title when reporting an Issue')
  }
  if (!body) {
    throw new Error('BUG: Empty body when reporting an Issue')
  }

  // Search for all Issues in the repo that match the title
  const {owner: repoOwner, repo: repoName} = context.repo()
  const query = `repo:${repoOwner}/${repoName} type:issue in:title ${title}`
  const {data: {items: issues}} = await context.github.search.issues({q: query, sort: 'updated', order: 'desc'})

  const issue = issues[0]

  // If we found an issue that matches the title and it is open, then do nothing
  // (TODO: Should we add a comment so people are emailed?)
  if (issue) {
    // TODO: Discuss whether to just check if the issue is closed (and reopen it)
    switch (issue.state) {
      case 'open':
        break
      case 'closed':
        // Reopen the Issue (TODO: add a comment)
        return context.github.issues.edit(context.repo({number: issue.number, state: 'open', body}))
      default:
        throw new Error(`BUG: Invalid Issue state '${issue.state}'`)
    }
  } else {
    // Create a new Issue
    return context.github.issues.create(context.repo({ title, body }))
  }
}

async function getConfigOrReportError (context, filename, handler) {
  try {
    return await context.config(filename)
  } catch (err) {
    await reportIssue(context, handler(err))
    throw err
  }
}

module.exports = {
  getConfigOrReportError,
  reportIssue
}
