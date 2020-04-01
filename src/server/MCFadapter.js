import { NormalDensityZx, computeCurve } from './utility'
import _ from 'lodash'

export class MCFAdapter {
  pool = null
  binsHash = {}

  setPool = dbObj => {
    this.pool = dbObj
    return 0
  }

  // Computes smooth histogram curve
  bellCurve = (sample, subsets, type) => {
    if (type === 'fpkm') {
      return this.pool
        .query(`SELECT ${sample}_log2 FROM mcf10a_vs_mcf7 WHERE ${sample}_log2 != 'Infinity'`)
        .then(result => {
          const log2fpkms = _.map(result.rows, r => r[`${sample}_log2`])
          return [computeCurve(this.binsHash, log2fpkms, sample)]
        })
    }

    // type === 'psi'
    const fullDataLine = this.pool
      .query(
        `SELECT ${sample}_avg_log2_psi FROM mcf_avg_psi WHERE ${sample}_avg_log2_psi is not null`
      )
      .then(result => {
        const avgPsiVals = _.map(result.rows, r => r[`${sample}_avg_log2_psi`])
        return computeCurve(this.binsHash, avgPsiVals, sample + '_ia')
      })
    const limitedDataLine = this.pool
      .query(
        `SELECT ${sample}_avg_log2_psi
        FROM mcf_avg_psi
        INNER JOIN u12_genes
        ON mcf_avg_psi.gene = u12_genes.gene
        WHERE ${sample}_avg_log2_psi is not null`
      )
      .then(result => {
        const avgPsiVals = _.map(result.rows, r => r[`${sample}_avg_log2_psi`])
        return computeCurve(this.binsHash, avgPsiVals, sample + '_u12_ia')
      })
    return Promise.all([fullDataLine, limitedDataLine]).then(values => {
      return values
    })
  }

  // Computes verticals to display on bellcurve
  vertical = (gene, samples, subsets, type) => {
    if (type === 'fpkm') {
      return this.pool
        .query(
          `
      SELECT
        gene,
        mcf10a_fpkm,
        mcf7_fpkm,
        mcf10a_log2,
        mcf7_log2,
        pvalue,
        log2_foldchange
      FROM mcf10a_vs_mcf7
      WHERE gene = $1
    `,
          [gene]
        )
        .then(results => {
          if (results.rows.length < 1) {
            return [] // gene not found
          }
          _.each(['mcf10a', 'mcf7'], sample => {
            if (this.binsHash[sample]) {
              results.rows[0][`${sample}_height`] = NormalDensityZx(
                results.rows[0][`${sample}_log2`],
                this.binsHash[sample].mean,
                this.binsHash[sample].stddev,
                this.binsHash[sample].scaleFactor
              )
            }
          })
          return results
        })
    }

    // type === 'psi'
    return this.pool
      .query(
        `
      SELECT
        gene,
        mcf10a_avg_log2_psi,
        mcf7_avg_log2_psi
      FROM mcf_avg_psi
      WHERE gene = $1
    `,
        [gene]
      )
      .then(results => {
        if (results.rows.length < 1) {
          return [] // gene not found
        }
        // Check if gene is in the u12 dataset
        return this.pool
          .query(
            `
          SELECT 1 FROM u12_genes WHERE gene= '${gene}'
        `
          )
          .then(u12Results => {
            const u12 = u12Results.rows.length > 0
            _.each(['mcf10a', 'mcf7'], sample => {
              _.each(u12 ? [sample, sample + '_u12'] : [sample], key => {
                if (this.binsHash[key + '_ia']) {
                  results.rows[0][`${key}_height`] = NormalDensityZx(
                    results.rows[0][`${sample}_avg_log2_psi`],
                    this.binsHash[key + '_ia'].mean,
                    this.binsHash[key + '_ia'].stddev,
                    this.binsHash[key + '_ia'].scaleFactor
                  )
                }
              })
              results.rows[0].u12 = u12
            })
            return results
          })
      })
  }

  heatMap = genes => {
    // Convert genes array to genes array for psql
    let genesList = _.join(genes, ',')
    genesList = `'{` + genesList + `}'`

    return this.pool.query(`
      SELECT
        key,
        gene,
        mcf10a_fpkm,
        mcf7_fpkm,
        mcf10a_log2,
        mcf7_log2
      FROM
        mcf10a_vs_mcf7
      JOIN
        unnest(${genesList}::varchar[]) WITH ORDINALITY t(gene, key) USING (gene)
      ORDER BY t.key
    `)
  }

  intronAnalysisHeatmap = gene => {
    return this.pool
      .query(
        `
      SELECT intron_number,
      mcf10a_log2_psi, mcf7_log2_psi
      FROM mcf_intron_psi WHERE gene = '${gene}' ORDER BY intron_number
    `
      )
      .then(results => {
        if (results.rows.length < 1) {
          return [] // gene not found
        }
        return results
      })
  }
}
