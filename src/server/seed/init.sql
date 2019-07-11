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

CREATE TABLE mcf_intron_psi
(
    gene VARCHAR,
    intron_number INT CHECK (intron_number > 0),
    mcf10a_psi FLOAT,
    mcf7_psi FLOAT,
    mcf10a_log2_psi FLOAT,
    mcf7_log2_psi FLOAT
);

CREATE TABLE mcf_avg_psi
(
    gene VARCHAR,
    mcf10a_avg_psi FLOAT,
    mcf7_avg_psi FLOAT,
    mcf10a_avg_log2_psi FLOAT,
    mcf7_avg_log2_psi FLOAT
);

CREATE TABLE U12_genes
(
    gene VARCHAR
);

CREATE TABLE TCGA_BRCA_genes_median
(
    gene VARCHAR,
    median_log2_norm_count_plus_1 FLOAT
);

CREATE TABLE TCGA_BRCA_U12_exons
(
    gene VARCHAR,
    exon INT,
    log2_rpkm_plus_1 JSONB

);

CREATE TABLE U12_rvalues
(
    gene VARCHAR,
    rvalue JSONB
);

CREATE TABLE RBP_genes
(
    gene VARCHAR
);

COPY MCF10A_vs_MCF7 FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data/mcf10a_vs_mcf7.csv' DELIMITER E'\t' CSV HEADER;
COPY RBP_rvalues FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data/RBP_rvalues.csv' DELIMITER E'\t' CSV HEADER QUOTE '"' ESCAPE '\';
COPY mcf_intron_psi FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data/mcf_intron_psi.csv' DELIMITER E'\t' CSV HEADER;
COPY mcf_avg_psi FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data/mcf_avg_psi.csv' DELIMITER E',' CSV HEADER;
COPY U12_genes FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data/U12_genes.csv' DELIMITER E',' CSV HEADER;
COPY TCGA_BRCA_U12_exons FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data/TCGA_BRCA_U12_exons.csv' DELIMITER E'\t' CSV HEADER QUOTE '"' ESCAPE '\';
COPY TCGA_BRCA_genes_median FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data/TCGA_BRCA_genes_median.csv' DELIMITER E',' CSV HEADER;
COPY U12_rvalues FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data/U12_rvalues.csv' DELIMITER E'\t' CSV HEADER QUOTE '"' ESCAPE '\';
COPY RBP_genes FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data/RBP_genes.csv' DELIMITER E',' CSV HEADER;
