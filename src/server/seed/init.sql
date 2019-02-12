CREATE TABLE MCF10A
(
    gene VARCHAR,
    fpkm FLOAT,
    log2 FLOAT
);

CREATE TABLE MCF7
(
    gene VARCHAR,
    fpkm FLOAT,
    log2 FLOAT
);

CREATE TABLE MCF10A_vs_MCF7
(
    gene VARCHAR,
    pvalue FLOAT,
    log2_foldchange FLOAT
);

COPY MCF10A FROM PROGRAM 'cut -f 1,2,6 /docker-entrypoint-initdb.d/data/MCF10A_MCF7_gene_exp.csv' DELIMITER E'\t' CSV HEADER;
COPY MCF7   FROM PROGRAM 'cut -f 1,3,7 /docker-entrypoint-initdb.d/data/MCF10A_MCF7_gene_exp.csv' DELIMITER E'\t' CSV HEADER;
COPY MCF10A_vs_MCF7 FROM PROGRAM 'cut -f 1,4,5 /docker-entrypoint-initdb.d/data/MCF10A_MCF7_gene_exp.csv' DELIMITER E'\t' CSV HEADER;
