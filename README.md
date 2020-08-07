# ecgraph

Extracts useful information from an ecological corridor and inject them into the topojson file

___

## :paperclip: Table of Contents
- :hammer: [Install](#hammer-install)
- :video_game: [Usage](#video_game-usage)
- :chart_with_upwards_trend: [Development](#chart_with_upwards_trend-development)
  - :scroll: [Rules](#scroll-rules)
    - [Commits](#commits)
    - [Branches](#branches)
- :page_facing_up: [License](#page_facing_up-license)
- :telephone_receiver: [Contacts](#telephone_receiver-contacts)
  - :boy: [Developers](#boy-developers)

## :hammer: Install

```bash
git clone https://github.com/epilurzu/ecgraph.git
cd ecgraph
npm i
```

## :video_game: Usage

More instruction will come.

```bash
ecgraph path/to/topojson/ecological_corridor.json
```

## :chart_with_upwards_trend: Development

### :scroll: Rules

#### Commits

* Use this commit message format (angular style):  

    `[<type>] <subject>`
    `<BLANK LINE>`
    `<body>`

    where `type` must be one of the following:

    - feat: A new feature
    - fix: A bug fix
    - docs: Documentation only changes
    - style: Changes that do not affect the meaning of the code
    - refactor: A code change that neither fixes a bug nor adds a feature
    - test: Adding missing or correcting existing tests
    - chore: Changes to the build process or auxiliary tools and libraries such as documentation generation
    - update: Update of the library version or of the dependencies

and `body` must be should include the motivation for the change and contrast this with previous behavior (do not add body if the commit is trivial). 

* Use the imperative, present tense: "change" not "changed" nor "changes".
* Don't capitalize first letter.
* No dot (.) at the end.

#### Branches

* There is a master branch, used only for release.
* There is a dev branch, used to merge all sub dev branch.
* Avoid long descriptive names for long-lived branches.
* No CamelCase.
* Use grouping tokens (words) at the beginning of your branch names (in a similar way to the `type` of commit).
* Define and use short lead tokens to differentiate branches in a way that is meaningful to your workflow.
* Use slashes to separate parts of your branch names.
* Remove branch after merge if it is not important.

Examples:
    
    git branch -b docs/README
    git branch -b test/one-function
    git branch -b feat/side-bar
    git branch -b style/header

## :page_facing_up: License
* See [LICENSE](https://github.com/epilurzu/ecgraph/blob/master/LICENSE) file.

## :telephone_receiver: Contacts
### :boy: Developer

#### Enrico Podda
* E-mail : e.ipodda@gmail.com
* Github : [@epilurzu](https://github.com/epilurzu)