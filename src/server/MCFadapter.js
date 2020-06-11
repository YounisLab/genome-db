import { NormalDensityZx, computeCurve } from './utility'
import _ from 'lodash'

export class MCFAdapter {
  binsHash = {}

  setDB = mongodbObj => {
    this.mongodb = mongodbObj
    return 0
  }

  // Computes smooth histogram curve
  bellCurve = (sample, subsets, type) => {
    if (type === 'fpkm') {
      const key = sample + '_log2'
      const conditions = {
        [key]: {
          $ne: Infinity
        }
      }
      const projection = {
        [key]: 1,
        _id: 0
      }
      return this.mongodb
        .collection('mcf10a_vs_mcf7')
        .find(conditions, { projection: projection })
        .toArray()
        .then(result => {
          const log2fpkms = _.map(result, r => r[`${sample}_log2`])
          return [computeCurve(this.binsHash, log2fpkms, sample)]
        })
    }
    // type === 'psi'
    const key = sample + '_avg_log2_psi'
    let conditions = {
      [key]: {
        $ne: ''
      }
    }
    let projection = {
      [key]: 1,
      _id: 0
    }
    const fullDataLine = this.mongodb
      .collection('mcf_avg_psi')
      .find(conditions, { projection: projection })
      .toArray()
      .then(result => {
        const avgPsiVals = _.map(result, r => r[`${sample}_avg_log2_psi`])
        return computeCurve(this.binsHash, avgPsiVals, sample + '_ia')
      })
    const transform = {
      u12_gene: 1,
      [key]: 1,
      matched: {
        $size: '$u12_gene'
      }
    }
    projection = {
      [key]: 1,
      _id: 0
    }
    conditions = {
      [key]: {
        $ne: ''
      },
      matched: {
        $gte: 1
      }
    }
    const query = [
      { $lookup: { from: 'u12_genes', localField: 'gene', foreignField: 'gene', as: 'u12_gene' } },
      { $project: transform },
      { $match: conditions },
      { $project: projection }
    ]
    const limitedDataLine = this.mongodb
      .collection('mcf_avg_psi')
      .aggregate(query)
      .toArray()
      .then(result => {
        const avgPsiVals = _.map(result, r => r[`${sample}_avg_log2_psi`])
        return computeCurve(this.binsHash, avgPsiVals, sample + '_u12_ia')
      })
    return Promise.all([fullDataLine, limitedDataLine])
  }

  // Computes verticals to display on bellcurve
  vertical = (gene, samples, subsets, type) => {
    if (type === 'fpkm') {
      const conditions = {
        gene: gene
      }
      const projection = {
        _id: 0
      }
      return this.mongodb
        .collection('mcf10a_vs_mcf7')
        .find(conditions, { projection: projection })
        .toArray()
        .then(results => {
          if (results.length < 1) {
            return [] // gene not found
          }
          _.each(['mcf10a', 'mcf7'], sample => {
            if (this.binsHash[sample]) {
              results[0][`${sample}_height`] = NormalDensityZx(
                results[0][`${sample}_log2`],
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
    let conditions = {
      gene: gene
    }
    let projection = {
      gene: 1,
      mcf10a_avg_log2_psi: 1,
      mcf7_avg_log2_psi: 1,
      _id: 0
    }
    return this.mongodb
      .collection('mcf_avg_psi')
      .find(conditions, { projection: projection })
      .toArray()
      .then(results => {
        if (results.length < 1) {
          return [] // gene not found
        }
        // Check if gene is in the u12 dataset
        conditions = {
          gene: gene
        }
        projection = {}
        return this.mongodb
          .collection('u12_genes')
          .find(conditions)
          .toArray()
          .then(u12Results => {
            const u12 = u12Results.length > 0
            _.each(['mcf10a', 'mcf7'], sample => {
              _.each(u12 ? [sample, sample + '_u12'] : [sample], key => {
                if (this.binsHash[key + '_ia']) {
                  results[0][`${key}_height`] = NormalDensityZx(
                    results[0][`${sample}_avg_log2_psi`],
                    this.binsHash[key + '_ia'].mean,
                    this.binsHash[key + '_ia'].stddev,
                    this.binsHash[key + '_ia'].scaleFactor
                  )
                }
              })
              results[0].u12 = u12
            })
            return results
          })
      })
  }

  heatMap = genes => {
    const projection = {
      pvalue: 0,
      log2_foldchange: 0,
      _id: 0
    }
    const query = [
      { $match: { gene: { $in: genes } } },
      { $addFields: { key: { $indexOfArray: [genes, '$gene'] } } },
      { $sort: { key: 1 } },
      { $project: projection }
    ]
    return this.mongodb.collection('mcf10a_vs_mcf7').aggregate(query).toArray()
  }

  intronAnalysisHeatmap = gene => {
    const conditions = {
      gene: gene
    }
    const projection = {
      intron_number: 1,
      mcf10a_log2_psi: 1,
      mcf7_log2_psi: 1,
      _id: 0
    }
    const order = {
      intron_number: 1
    }
    return this.mongodb
      .collection('mcf_intron_psi')
      .find(conditions, { projection: projection })
      .sort(order)
      .toArray()
  }
}
