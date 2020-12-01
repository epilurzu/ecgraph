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
npm link
```

## :video_game: Usage

The software uses maps of [protected areas](https://www.eea.europa.eu/data-and-maps/data/natura-11) defined by the European [Natura 2000 project](https://ec.europa.eu/environment/nature/natura2000/) to spot patches of the ecological corridor that intersect them.

To easily manage, read and compute areas and corridors maps for the software, it is necessary to input files in [TopoJSON](https://github.com/topojson/topojson-specification/blob/master/README.md) format. So much thanks to [mapshaper](https://github.com/mbloch/mapshaper) of [mbloch](https://github.com/mbloch), it was very useful to convert big geodata files!

TopoJSON files of Natura 2000 protected areas split by states can be downloaded from [here](https://mega.nz/file/NANynRSC#aTELyREopayF35OK1rZv5sklPPypubycqYCkzu_oTRU).

TopoJSON file of ecological corridor for now has to be provided by the user. Sorry :disappointed:

* Command example:  

```bash
ecgraph -c path/to/corridor.json -a path/to/area/.json --key id --accuracy 0.00001 --max_degree 4 --max_distance 10 -o path to output
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