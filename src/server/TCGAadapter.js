import _ from 'lodash'
import { NormalDensityZx, computeCurve } from './utility'

export class TCGAAdapter {
  binsHash = {}

  setDB = mongodbObj => {
    this.mongodb = mongodbObj
    return 0
  }

  bellCurve = (sample, subsets, type) => {
    let projection = {
      median_log2_norm_count_plus_1: 1,
      _id: 0
    }
    const fullDataLine = this.mongodb
      .collection('tcga_brca_genes_median')
      .find({}, { projection: projection })
      .toArray()
      .then(result => {
        const medianCounts = _.map(result, r => {
          return r.median_log2_norm_count_plus_1
        })
        return computeCurve(this.binsHash, medianCounts, sample)
      })
    let conditions = {
      matched: {
        $gte: 1
      }
    }
    let transform = {
      rbp_gene: 1,
      median_log2_norm_count_plus_1: 1,
      matched: {
        $size: '$rbp_gene'
      }
    }
    projection = {
      median_log2_norm_count_plus_1: 1,
      _id: 0
    }
    let query = [
      { $lookup: { from: 'rbp_genes', localField: 'gene', foreignField: 'gene', as: 'rbp_gene' } },
      { $project: transform },
      { $match: conditions },
      { $project: projection }
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
    conditions = {
      matched: {
        $gte: 1
      }
    }
    transform = {
      u12_gene: 1,
      median_log2_norm_count_plus_1: 1,
      matched: {
        $size: '$u12_gene'
      }
    }
    projection = {
      median_log2_norm_count_plus_1: 1,
      _id: 0
    }
    query = [
      { $lookup: { from: 'u12_genes', localField: 'gene', foreignField: 'gene', as: 'u12_gene' } },
      { $project: transform },
      { $match: conditions },
      { $project: projection }
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

    return Promise.all([fullDataLine, rbpDataLine, u12DataLine])
  }

  vertical = (gene, samples, subsets, type) => {
    let conditions = {
      gene: gene
    }
    let projection = {
      gene: 1,
      median_log2_norm_count_plus_1: 1,
      _id: 0
    }
    return this.mongodb
      .collection('tcga_brca_genes_median')
      .find(conditions, { projection: projection })
      .toArray()
      .then(results => {
        results.u12 = false
        results.rbp = false
        if (results.length < 1) {
          return [] // gene not found
        }
        const samples = ['tcga']
        // Check if gene is in the u12 dataset
        conditions = {
          gene: gene
        }
        projection = {
          _id: 0
        }
        return this.mongodb
          .collection('u12_genes')
          .find(conditions, { projection: projection })
          .toArray()
          .then(u12Results => {
            if (u12Results.length > 0) {
              samples.push('tcga_u12')
              results[0].u12 = true
            }
            // Check if gene is in rbp dataaset
            conditions = {
              gene: gene
            }
            projection = {
              _id: 0
            }
            return this.mongodb
              .collection('rbp_genes')
              .find(conditions, { projection: projection })
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
    min = Number(min) || Number.MIN_SAFE_INTEGER
    max = Number(max) || Number.MAX_SAFE_INTEGER
    const conditions = {
      gene: gene
    }
    const projection = {
      rvalues: 1,
      _id: 0
    }
    const query = [
      { $match: conditions },
      {
        $project: {
          rvalues: {
            $filter: {
              input: '$rvalues',
              as: 'entry',
              cond: {
                $and: [
                  { $ne: ['$$entry.rvalue', 'N/A'] },
                  { $gt: ['$$entry.rvalue', min] },
                  { $lt: ['$$entry.rvalue', max] }
                ]
              }
            }
          }
        }
      },
      { $unwind: '$rvalues' },
      { $sort: { 'rvalues.rvalue': -1 } },
      { $group: { _id: '$_id', rvalues: { $push: '$rvalues' } } },
      { $project: projection }
    ]
    // Returns RBP names with corresponing Rvalue for gene in sorted order
    return this.mongodb
      .collection(table)
      .aggregate(query)
      .toArray()
      .then(results => {
        if (results.length < 1) {
          return [] // gene not found
        }
        return results[0].rvalues
      })
  }
}
