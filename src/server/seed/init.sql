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
    log2_foldchange FLOAT,
    pvalue FLOAT
);

COPY MCF10A FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data/MCF7.csv' DELIMITER E'\t' CSV HEADER;
COPY MCF7   FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data/MCF10A.csv' DELIMITER E'\t' CSV HEADER;
COPY MCF10A_vs_MCF7 FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data/MCF10A_vs_MCF7.csv' DELIMITER E'\t' CSV HEADER;
