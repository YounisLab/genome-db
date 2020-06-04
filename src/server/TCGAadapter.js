import _ from 'lodash'
import { NormalDensityZx, computeCurve } from './utility'

// Return RBP json filtered to remove 'NA'
// and match range
function rangeFilter(rvals, min, max) {
  return _.pickBy(rvals, value => {
    return (
      value !== 'N/A' &&
      // If either min or max defined make
      // appropriate comparison
      (min == null || value > min) &&
      (max == null || value < max)
    )
  })
}

export class TCGAAdapter {
  pool = null
  binsHash = {}

  setPool = (dbObj, mongodbObj) => {
    this.pool = dbObj
    this.mongodb = mongodbObj
    return 0
  }

  bellCurve = (sample, subsets, type) => {
    let select = {}
    select.median_log2_norm_count_plus_1 = 1
    select._id = 0
    const fullDataLine = this.mongodb
      .collection('tcga_brca_genes_median')
      .find({}, { projection: select })
      .toArray()
      .then(result => {
        const medianCounts = _.map(result, r => {
          return r.median_log2_norm_count_plus_1
        })
        return computeCurve(this.binsHash, medianCounts, sample)
      })
    let conditions = {}
    let transform = {}
    select = {}
    conditions.matched = { $gte: 1 }
    transform.rbp_gene = 1
    transform.median_log2_norm_count_plus_1 = 1
    transform.matched = { $size: '$rbp_gene' }
    select._id = 0
    select.median_log2_norm_count_plus_1 = 1
    let query = [
      { $lookup: { from: 'rbp_genes', localField: 'gene', foreignField: 'gene', as: 'rbp_gene' } },
      { $project: transform },
      { $match: conditions },
      { $project: select }
    ]
    const rbpDataLine = this.mongodb
      .collection('tcga_brca_genes_median')
      .aggregate(query)
      .toArray()
      .then(result => {
        const medianCounts = _.map(result, r => {
          return r.median_log2_norm_count_plus_1
        })
        return computeCurve(this.binsHash, medianCounts, sample + '_rbp')
      })
    conditions = {}
    transform = {}
    select = {}
    conditions.matched = { $gte: 1 }
    transform.u12_gene = 1
    transform.median_log2_norm_count_plus_1 = 1
    transform.matched = { $size: '$u12_gene' }
    select._id = 0
    select.median_log2_norm_count_plus_1 = 1
    query = [
      { $lookup: { from: 'u12_genes', localField: 'gene', foreignField: 'gene', as: 'u12_gene' } },
      { $project: transform },
      { $match: conditions },
      { $project: select }
    ]
    const u12DataLine = this.mongodb
      .collection('tcga_brca_genes_median')
      .aggregate(query)
      .toArray()
      .then(result => {
        const medianCounts = _.map(result, r => {
          return r.median_log2_norm_count_plus_1
        })
        return computeCurve(this.binsHash, medianCounts, sample + '_u12')
      })

    return Promise.all([fullDataLine, rbpDataLine, u12DataLine]).then(values => {
      return values
    })
  }

  vertical = (gene, samples, subsets, type) => {
    let conditions = {}
    let select = {}
    conditions.gene = gene
    select.gene = 1
    select.median_log2_norm_count_plus_1 = 1
    select._id = 0
    return this.mongodb
      .collection('tcga_brca_genes_median')
      .find(conditions, { projection: select })
      .toArray()
      .then(results => {
        results.u12 = false
        results.rbp = false
        if (results.length < 1) {
          return [] // gene not found
        }
        const samples = ['tcga']
        // Check if gene is in the u12 dataset
        conditions = {}
        select = {}
        conditions.gene = gene
        select._id = 0
        return this.mongodb
          .collection('u12_genes')
          .find(conditions, { projection: select })
          .toArray()
          .then(u12Results => {
            if (u12Results.length > 0) {
              samples.push('tcga_u12')
              results[0].u12 = true
            }
            // Check if gene is in rbp dataaset
            conditions = {}
            select = {}
            conditions.gene = gene
            select._id = 0
            return this.mongodb
              .collection('rbp_genes')
              .find(conditions, { projection: select })
              .toArray()
              .then(rbpResults => {
                if (rbpResults.length > 0) {
                  samples.push('tcga_rbp')
                  results[0].rbp = true
                }
                _.each(samples, sample => {
                  if (this.binsHash[sample]) {
                    results[0][`${sample}_height`] = NormalDensityZx(
                      results[0].median_log2_norm_count_plus_1,
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
    const conditions = {}
    const select = {}
    conditions.gene = gene
    select.rvalue = 1
    select._id = 0
    // Returns RBP names with corresponing Rvalue for gene in sorted order
    return this.mongodb
      .collection(table)
      .find(conditions, { projection: select })
      .toArray()
      .then(results => {
        if (results.length < 1) {
          return [] // gene not found
        }
        // Pass just json with gene:correlation
        const filteredRvals = rangeFilter(results[0].rvalue, min, max)
        // Map to object with gene and rvals as keys
        const mappedRvals = _.map(filteredRvals, (value, gene) => {
          return { gene: gene, Rvalue: value }
        })
        return _.reverse(
          _.sortBy(mappedRvals, o => {
            return o.Rvalue // We use reciprocal to achieve descending sort
          })
        )
      })
  }
}
