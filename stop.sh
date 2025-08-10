#!/bin/bash
clear
set -e
 
echo "--- Stopping and removing all Docker containers and volumes ---"
docker-compose down -v --remove-orphans
echo "--- Application stopped successfully ---" 