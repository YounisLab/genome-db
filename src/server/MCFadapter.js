import { NormalDensityZx, computeCurve } from './utility'
import _ from 'lodash'

export class MCFAdapter {
  pool = null
  binsHash = {}

  setPool = (dbObj, mongodbObj) => {
    this.pool = dbObj
    this.mongodb = mongodbObj
    return 0
  }

  // Computes smooth histogram curve
  bellCurve = (sample, subsets, type) => {
    if (type === 'fpkm') {
      let key = sample + '_log2'
      let conditions = {}
      let select = {}
      conditions[key] = { $ne: Infinity }
      select[key] = 1
      select._id = 0
      return this.mongodb
        .collection('mcf10a_vs_mcf7')
        .find(conditions, {projection: select})
        .toArray()
        .then(result => {
          const log2fpkms = _.map(result, r => r[`${sample}_log2`])
          return [computeCurve(this.binsHash, log2fpkms, sample)]
        })
    }
    // type === 'psi'
    let key = sample + '_avg_log2_psi'
    let conditions = {}
    let select = {}
    conditions[key] = { $ne: '' }
    select[key] = 1
    select._id = 0
    const fullDataLine = this.mongodb
      .collection('mcf_avg_psi')
      .find(conditions, {projection : select})
      .toArray()
      .then(result => {
        const avgPsiVals = _.map(result, r => r[`${sample}_avg_log2_psi`])
        return computeCurve(this.binsHash, avgPsiVals, sample + '_ia')
      })
    conditions = {}
    let transform = {}
    select = {}
    conditions[key] = { $ne: '' }
    conditions['matched'] = { $gte: 1 }
    transform['u12_gene'] = 1
    transform[key] = 1
    transform['matched'] = { "$size": "$u12_gene" }
    select._id = 0
    select[key] = 1
    let query = [
      {$lookup: {from: 'u12_genes', localField: 'gene', foreignField: 'gene', as: 'u12_gene'}},
      {$project: transform},
      {$match: conditions},
      {$project: select}
     ]
    const limitedDataLine = this.mongodb
      .collection('mcf_avg_psi')
      .aggregate(query)
      .toArray()
      .then(result => {
        const avgPsiVals = _.map(result, r => r[`${sample}_avg_log2_psi`])
        return computeCurve(this.binsHash, avgPsiVals, sample + '_u12_ia')
      })
    return Promise.all([fullDataLine, limitedDataLine]).then(values => {
      return values
    })
  }

  // Computes verticals to display on bellcurve
  vertical = (gene, samples, subsets, type) => {
    if (type === 'fpkm') {
      let conditions = {}
      let select = {}
      conditions['gene'] = gene
      select._id = 0
      return this.mongodb
        .collection('mcf10a_vs_mcf7')
        .find(conditions, {projection: select})
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
    let conditions = {}
    let select = {}
    conditions['gene'] = gene
    select['gene'] = 1
    select['mcf10a_avg_log2_psi'] = 1
    select['mcf7_avg_log2_psi'] = 1
    select._id = 0
    return this.mongodb
      .collection('mcf_avg_psi')
      .find(conditions, {projection: select})
      .toArray()
      .then(results => {
        if (results.length < 1) {
          return [] // gene not found
        }
        // Check if gene is in the u12 dataset
        conditions = {}
        select = {}
        conditions['gene'] = gene
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
    let select = {}
    select['pvalue'] = 0
    select._id = 0
    select['log2_foldchange'] = 0
    let query = [
      {$match: {gene: {$in: genes}}},
      {$addFields: {"key": {$indexOfArray: [genes, "$gene" ]}}},
      {$sort: {"key": 1}},
      {$project: select }
     ]
    return this.mongodb
      .collection('mcf10a_vs_mcf7')
      .aggregate(query)
      .toArray()
  }

  intronAnalysisHeatmap = gene => {
    let conditions = {}
    let select = {}
    let order = {}
    conditions['gene'] = gene
    select['intron_number'] = 1
    select['mcf10a_log2_psi'] = 1
    select['mcf7_log2_psi'] = 1
    select._id = 0
    order['intron_number'] = 1
    return this.mongodb
      .collection('mcf_intron_psi')
      .find(conditions, {projection: select})
      .sort(order)
      .toArray()
      .then(results => {
        if (results.length < 1) {
          return [] // gene not found
        }
        return results
      })
  }
}