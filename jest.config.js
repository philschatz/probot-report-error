module.exports = {
  moduleNameMapper: {
    // Remap node-fetch to use fetch-vcr so octokit uses the `_fixtures/`
    // directory instead of making actual requests.
    'hack-node-fetch': 'node-fetch',
    'node-fetch': 'fetch-vcr'
  }
}
