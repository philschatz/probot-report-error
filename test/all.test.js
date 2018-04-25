require('dotenv').config()
const {readdirSync} = require('fs')
const {join: pathJoin} = require('path')
const fetch = require('fetch-vcr')
const Context = require('probot/lib/context')
const Octokit = require('@octokit/rest')

const reportIssue = require('../lib/report-issue')

// This sets the fixture, runs the commands, and then verifies that each file
// in the directory was loaded exactly once.
async function usingFixture (name, fn) {
  const fixturePath = pathJoin(__dirname, '_fixtures', name)
  fetch.clearCalled()
  fetch.configure({
    fixturePath: fixturePath
  })
  const ret = await fn()
  const apiCalls = fetch.getCalled()
  const calledFiles = apiCalls
    .map(({bodyFilename}) => bodyFilename)
    .concat(apiCalls.map(({optionsFilename}) => optionsFilename))
  const allFiles = readdirSync(fixturePath)
  expect(calledFiles.sort()).toEqual(allFiles.sort())
  return ret
}

describe('Report Issue', () => {
  let context

  beforeEach(() => {
    // Create a Probot Context for each test.
    // The payload is just enough for `context.repo()` to work.
    // Also, use the GitHub token in case we are recording the fixtures.
    const github = new Octokit()
    const log = undefined
    const event = {
      payload: {
        repository: {
          name: 'test',
          owner: {
            login: 'philschatz'
          }
        }
      }
    }

    if (process.env.GITHUB_TOKEN) {
      github.authenticate({
        type: 'token',
        token: process.env.GITHUB_TOKEN
      })
    }
    context = new Context(event, github, log)
  })

  it('Can get a single repository (sanity check)', async () => {
    return usingFixture('sanity-check', () =>
      context.github.repos.get(context.repo())
    )
  })

  it('Can create a new Issue when one does not exist yet', async () => {
    return usingFixture('fresh-issue', () =>
      reportIssue(context, {
        title: 'ReportIssue Title',
        body: 'ReportIssue Body'
      })
    )
  })

  it('Does not create a new Issue when one is already open', async () => {
    return usingFixture('already-open-issue', () =>
      reportIssue(context, {
        title: 'ReportIssue Title',
        body: 'ReportIssue Body'
      })
    )
  })

  it('Reopens an Issue when one is closed', async () => {
    return usingFixture('already-closed-issue', () =>
      reportIssue(context, {
        title: 'ReportIssue Title',
        body: 'ReportIssue Body'
      })
    )
  })
})
