#!/usr/bin/env bash

# CREATE TABLES

psql `heroku config:get DATABASE_URL` -c "DROP TABLE MCF10A_vs_MCF7;"
psql `heroku config:get DATABASE_URL` -c \
"CREATE TABLE MCF10A_vs_MCF7 (gene VARCHAR, mcf10a_fpkm FLOAT, mcf10a_log2 FLOAT, mcf7_fpkm FLOAT, mcf7_log2 FLOAT, log2_foldchange FLOAT, pvalue FLOAT);"

psql `heroku config:get DATABASE_URL` -c "DROP TABLE RBP_RVALUES;"
psql `heroku config:get DATABASE_URL` -c \
"CREATE TABLE RBP_RVALUES ( gene VARCHAR, rvalue JSONB );"

psql `heroku config:get DATABASE_URL` -c "DROP TABLE MCF_INTRON_PSI;"
psql `heroku config:get DATABASE_URL` -c \
"CREATE TABLE MCF_INTRON_PSI ( gene VARCHAR, intron_number INT CHECK (intron_number > 0), mcf10a_psi FLOAT, mcf7_psi FLOAT );"

# UPLOAD DATA

cat mcf10a_vs_mcf7.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY MCF10A_vs_MCF7 FROM STDIN DELIMITER E'\t' CSV HEADER;"

cat RBP_rvalues.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY RBP_RVALUES FROM STDIN DELIMITER E'\t' CSV HEADER QUOTE '\"' ESCAPE '\';"

cat mcf_intron_psi.csv | \
psql `heroku config:get DATABASE_URL` -c "COPY MCF_INTRON_PSI FROM STDIN DELIMITER E'\t' CSV HEADER;"
