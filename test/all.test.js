require('dotenv').config()
const {join: pathJoin} = require('path')
const fetch = require('fetch-vcr')
const Context = require('probot/lib/context')
const Octokit = require('@octokit/rest')

fetch.configure({
  fixturePath: pathJoin(__dirname, './_fixtures/')
})

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
const context = new Context(event, github, log)

describe('Sanity check', () => {
  it('Can get a single repository', async () => {
    return context.github.repos.get(context.repo()).then(resp => {
      console.log(resp.data)
    })
  })
})
