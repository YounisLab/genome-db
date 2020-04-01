import _ from 'lodash'
import { NormalDensityZx, computeCurve } from './utility'

// Return RBP json filtered to remove 'NA'
// and match range
function rangeFilter (rvals, min, max) {
  return _.pickBy(rvals,  value => {
    return value !== 'N/A' &&
    // If either min or max defined make
    // appropriate comparison
    (min == null || value > min) &&
    (max == null || value < max)
  })
}

export class TCGAAdapter {
  pool = null
  binsHash = {}

  setPool = (dbObj) => {
    this.pool = dbObj
    return 0
  }

  bellCurve = (sample, subsets, type) => {
    var fullDataLine = this.pool.query(
      `SELECT median_log2_norm_count_plus_1 FROM tcga_brca_genes_median`)
      .then(result => {
        var medianCounts = _.map(result.rows, (r) => {
          return r['median_log2_norm_count_plus_1']
        })
        return computeCurve(this.binsHash, medianCounts, sample)
      })

    var rbpDataLine = this.pool.query(
      `SELECT median_log2_norm_count_plus_1 FROM tcga_brca_genes_median
      INNER JOIN rbp_genes
      ON tcga_brca_genes_median.gene = rbp_genes.gene`)
      .then(result => {
        var medianCounts = _.map(result.rows, (r) => {
          return r['median_log2_norm_count_plus_1']
        })
        return computeCurve(this.binsHash, medianCounts, sample + '_rbp')
      })

    var u12DataLine = this.pool.query(
      `SELECT median_log2_norm_count_plus_1 FROM tcga_brca_genes_median
      INNER JOIN u12_genes
      ON tcga_brca_genes_median.gene = u12_genes.gene`)
      .then(result => {
        var medianCounts = _.map(result.rows, (r) => {
          return r['median_log2_norm_count_plus_1']
        })
        return computeCurve(this.binsHash, medianCounts, sample + '_u12')
      })

    return Promise.all([fullDataLine, rbpDataLine, u12DataLine])
      .then(values => {
        return values
      })
  }

  vertical = (gene, samples, subsets, type) => {
    return this.pool.query(`
      SELECT
        gene,
        median_log2_norm_count_plus_1
      FROM tcga_brca_genes_median
      WHERE gene = $1
    `, [gene])
      .then(results => {
        results.rows.u12 = false
        results.rows.rbp = false
        if (results.rows.length < 1) {
          return [] // gene not found
        }
        const samples = ['tcga']
        // Check if gene is in the u12 dataset
        return this.pool.query(`
          SELECT 1 FROM u12_genes WHERE gene= '${gene}'
        `)
          .then(u12Results => {
            if (u12Results.rows.length > 0) {
              samples.push('tcga_u12')
              results.rows[0].u12 = true
            }
            // Check if gene is in rbp dataaset
            return this.pool.query(`
              SELECT 1 FROM rbp_genes WHERE gene= '${gene}'
            `)
              .then(rbpResults => {
                if (rbpResults.rows.length > 0) {
                  samples.push('tcga_rbp')
                  results.rows[0].rbp = true
                }
                _.each(samples, sample => {
                  if (this.binsHash[sample]) {
                    results.rows[0][`${sample}_height`] = NormalDensityZx(
                      results.rows[0][`median_log2_norm_count_plus_1`],
                      this.binsHash[sample].mean,
                      this.binsHash[sample].stddev,
                      this.binsHash[sample].scaleFactor
                    )
                  }
                })
                return results
              })
          })
      })
  }

  correlations = (table, gene, min, max) => {
    // Returns RBP names with corresponing Rvalue for gene in sorted order
    return this.pool.query(`SELECT rvalue FROM ${table} WHERE gene = '${gene}'`)
      .then(results => {
        if (results.rows.length < 1) {
          return [] // gene not found
        }
        // Pass just json with gene:correlation
        var filteredRvals = rangeFilter(results.rows[0].rvalue, min, max)
        // Map to object with gene and rvals as keys
        var mappedRvals = _.map(filteredRvals, (value, gene) => {
          return { gene: gene, Rvalue: value }
        })
        return _.reverse(_.sortBy(mappedRvals, o => {
          return o.Rvalue // We use reciprocal to achieve descending sort
        }))
      })
  }
}
