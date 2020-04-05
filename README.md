# GenomeDB

## Building

Install [git](https://git-scm.com/), [git-lfs](https://git-lfs.github.com/), [Docker](https://docs.docker.com/install/) & [Docker Compose](https://docs.docker.com/compose/install/).

Then,

```
git lfs clone git@github.com:YounisLab/GenomeDB.git
cd GenomeDB
```

Note that the clone process might take some time due to git-lfs downloading data files.

If you wish to download only the source code and not any of the data files, set `export GIT_LFS_SKIP_SMUDGE=1` before 
running `git lfs clone`.

Build and run the app:

```
docker-compose build
docker-compose up
```

In order for the app to serve data, we must unpack the data files and load it into mongodb:

```
cd ./src/server/seed/data
unzip data.zip

# Make sure `docker-compose up` is running before executing the command below:
./seed-mongo.sh mongodb://localhost/genomedb
```

This will start GenomeDB on port 3000. Navigate to http://localhost:3000 to view the website.

## Contributing

Make sure to install [eslint](https://eslint.org/) and [prettier](https://prettier.io/) for your text-editor. These
tools will automatically flag formatting errors and styling issues with your code.

Any changes made inside `src/client` or `src/server` will be captured by the containers and
reflected in the browser. Changes made outside these folders require re-building using `docker-compose build`,
and then `docker-compose up` to to bring them up again.

