#!/bin/bash

docker-compose --env-file "./.env" up --force-recreate --remove-orphans --detach
