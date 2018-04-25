To update these fixtures:

1. Create a https://github.com/settings/tokens/new
1. Create a `.env` file in the root of the repository and set `GITHUB_TOKEN="......"`
1. Run `VCR_MODE=cache npm test` or see more options at https://github.com/philschatz/fetch-vcr
