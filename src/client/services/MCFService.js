const axios = require('axios')
const _ = require('lodash')

class MCFService {
  study = 'mcf'

  samples = ['mcf10a', 'mcf7']

  subsets = ['u12']

  types = ['fpkm', 'psi']

  getBellCurve = (type, subsets = []) => {
    // Generate requests for each sample
    const requests = _.map(this.samples, sample => {
      return axios.get('/api/bellcurve', {
        params: {
          study: this.study,
          sample: sample,
          subsets: subsets,
          type: type
        }
      })
    })

    const data = []
    return axios.all(requests)
      .then(axios.spread((...responses) => {
        _.each(responses, resp => {
          const sample = resp.config.params.sample
          data.push({ sample: sample, data: resp.data })
        })

        return data
      }))
  }

  getVertical = (gene, type, subsets = []) => {
    return axios.get('/api/vertical', {
      params: {
        study: this.study,
        samples: this.samples,
        gene: gene.toUpperCase(), // DB stores gene names in UPPERCASE,
        subsets: subsets,
        type: type
      }
    })
      .then(resp => {
        if (!resp.data) {
          return null
        }

        const data = resp.data[0]

        return data
      })
  }

  getHeatMap = (genes) => {
    return axios.post('/api/heatmap', {
      study: this.study,
      genes: genes
    })
      .then(resp => {
        return resp.data
      })
  }

  getIntronAnalysisHeatMap = (gene) => {
    return axios.get('/api/intron-analysis-heatmap', {
      params: {
        study: 'mcf',
        gene: gene.toUpperCase()
      }
    })
      .then(resp => {
        return resp.data
      })
  }
}

export { MCFService }
