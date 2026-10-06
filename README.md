# template-new-repository

Template repository for creating new repositories in the **sehv-oss** organization.

It documents every step required to set up a new repository — regardless of language or stack. The goal is for every repository to start with a consistent configuration and reach **100% Community Standards**.

## Creating a New Repository

1. Create a new **public** repository on GitHub using this repository as a template (**Use this template > Create a new repository**).
2. Go through the checklist below and verify every item.

## Setup Checklist

### 1. About Section (gear icon next to "About" on the repository home page)

- [ ] Fill in the **Description**
- [ ] Fill in the **Website** (optional)
- [ ] Check **only** _Releases_ (uncheck _Packages_ and _Deployments_)

### 2. General Settings (`Settings > General`)

- [ ] **Features** — enable **only** the following (leave Wikis, Discussions, Projects, and Sponsorships disabled):
  - **Issues**
  - **Preserve this repository** (GitHub Archive Program)
  - **Pull Requests**
- [ ] **Pull Requests** — enable **only** _Allow squash merging_, with _Default message_ as the default commit message (keep _Allow merge commits_ and _Allow rebase merging_ disabled)
- [ ] Check **Automatically delete head branches**

### 3. Ruleset (`Settings > Rules > Rulesets`)

- [ ] Create the default ruleset for the repository: **New ruleset > Import a ruleset** an exported file from another repository in the organization.

### 4. Moderation (`Settings > Moderation options > Reported content`)

- [ ] Enable reported content and select **Prior contributors and collaborators**

### 5. Security (`Settings > Advanced Security`)

- [ ] Enable **Private vulnerability reporting** (required by the reporting channel referenced in `SECURITY.md`)

### 6. Community Standards (`Insights > Community Standards`)

Verify that the checklist shows **100%**.
