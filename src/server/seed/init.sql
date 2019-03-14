CREATE TABLE MCF10A_vs_MCF7
(
    gene VARCHAR,
    mcf10a_fpkm FLOAT,
    mcf10a_log2 FLOAT,
    mcf7_fpkm FLOAT,
    mcf7_log2 FLOAT,
    log2_foldchange FLOAT,
    pvalue FLOAT
);

CREATE TABLE RBP_rvalues
(
    gene VARCHAR,
    rvalue JSONB
);

COPY MCF10A_vs_MCF7 FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data/mcf10a_vs_mcf7.csv' DELIMITER E'\t' CSV HEADER;
COPY RBP_rvalues FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data/RBP_rvalues.csv' DELIMITER E'\t' CSV HEADER QUOTE '"' ESCAPE '\';
