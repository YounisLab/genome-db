#!/usr/bin/env bash
# Imports all csv files to mongo

set -e

if [ "$#" -ne 1 ]; then
    echo "usage: ./seed-mongo.sh <MONGO_URI>"
    exit 1
fi

MONGO_URI=$1
echo $1

# run_mongoimport (filename, collectionName)
run_mongoimport () {
  filename=$1
  collectionName=$2

  extension="${filename##*.}"

  if [ "$extension" = "json" ]; then
    headerline=""
  else
    headerline="--headerline"
  fi

  # assumes mongo service is up and running and has /seed/data mapped
  docker-compose exec -w /seed/data/ mongo \
    mongoimport -vvv -c $2 --type $extension --file $1 $headerline --uri $MONGO_URI
}

run_mongoimport "mcf10a_vs_mcf7.csv" "mcf10a_vs_mcf7"
run_mongoimport "mcf_avg_psi.csv" "mcf_avg_psi"
run_mongoimport "mcf_intron_psi.csv" "mcf_intron_psi"
run_mongoimport "RBP_genes.csv" "rbp_genes"
run_mongoimport "RBP_rvalues.json" "rbp_rvalues"
run_mongoimport "TCGA_BRCA_genes_median.csv" "tcga_brca_genes_median"
run_mongoimport "TCGA_BRCA_U12_exons.json" "tcga_brca_u12_exons"
run_mongoimport "U12_genes.csv" "u12_genes"
run_mongoimport "U12_rvalues.json" "u12_rvalues"
