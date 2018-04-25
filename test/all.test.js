require('dotenv').config()
const {join: pathJoin} = require('path')
const fetch = require('fetch-vcr')
const Context = require('probot/lib/context')
const Octokit = require('@octokit/rest')

const reportIssue = require('../lib/report-issue')

function useFixture (name) {
  fetch.configure({
    fixturePath: pathJoin(__dirname, '_fixtures', name)
  })
}

describe('Sanity check', () => {
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
    useFixture('sanity-check')
    return context.github.repos.get(context.repo())
  })

  it('Can create a new Issue when one does not exist yet', async () => {
    useFixture('fresh-issue')
    return reportIssue(context, {
      title: 'ReportIssue Title',
      body: 'ReportIssue Body'
    })
  })

  it('Does not create a new Issue when one is already open', async () => {
    useFixture('already-open-issue')
    return reportIssue(context, {
      title: 'ReportIssue Title',
      body: 'ReportIssue Body'
    })
  })

  it('Reopens an Issue when one is closed', async () => {
    useFixture('already-closed-issue')
    return reportIssue(context, {
      title: 'ReportIssue Title',
      body: 'ReportIssue Body'
    })
  })
})
