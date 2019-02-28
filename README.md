# GenomeDB

## Building

Install [git](https://git-scm.com/), [git-lfs](https://git-lfs.github.com/), [Docker](https://docs.docker.com/install/) & [Docker Compose](https://docs.docker.com/compose/install/).

Then,

```
git clone git@github.com:YounisLab/GenomeDB.git
cd GenomeDB
docker-compose build
docker-compose up
```

This will start GenomeDB on port 3000. Navigate to http://localhost:3000.

Any changes made inside `src/client` or `src/server` will be captured by the containers and
reflected in the browser.

Changes made outside these folders require restarting the services using `docker-compose up`.

## Known issues

### Postgres Seeding

The Docker instance of Postgres will not seed if it already detects an existing volume for GenomeDB.

To trigger the seeding, simply remove the volume, then run restart the services:

```
docker volume rm genomedb_genomepg
docker-compose up
```
