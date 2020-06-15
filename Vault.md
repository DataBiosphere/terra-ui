# Instructions for setting up Vault on your Local Machine

The Terra UI team maintains our own instructions for using Vault, because we do not use it within docker. The instructions for how to use general Vault within Docker can be found [here](https://github.com/broadinstitute/dsde-toolbox#authenticating-to-vault)

To setup Vault, you first need to ensure you have a github token with the read:org permission. This can be done by going to [the github personal access tokens page](https://github.com/settings/tokens) and creating a new github access token. This access token can then be used to authenticate vault.

Once you have your github token saved, you can then run the following commands:
1. `export VAULT_ADDR=https://clotho.broadinstitute.org:8200`
2. ``vault login -method=github token=`cat <<PATH_TO_GITHUB_TOKEN>>` ``
3. You can then run commands like: `vault read --format=json <<PATH_TO_SECRET>>`