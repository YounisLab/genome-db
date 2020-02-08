const axios = require('axios')
const _ = require('lodash')

class MCFService {
  study = 'mcf'

  samples = ['mcf10a', 'mcf7']

  subsets = []

  type = 'fpkm'

  getBellCurve = () => {
    // Generate requests for each sample
    const requests = _.map(this.samples, sample => {
      return axios.get('/api/bellcurve', {
        params: {
          study: this.study,
          sample: sample,
          subsets: this.subsets,
          type: this.type
        }
      })
    })

    const data = []
    return axios.all(requests)
      .then(axios.spread((...responses) => {
        _.each(responses, resp => {
          const sample = resp.config.params.sample
          data.push({ sample: sample, data: resp.data[0] })
        })

        return data
      }))
  }

  getVertical = (gene) => {
    return axios.get('/api/vertical', {
      params: {
        study: this.study,
        samples: this.samples,
        gene: gene.toUpperCase(), // DB stores gene names in UPPERCASE,
        subsets: this.subsets,
        type: this.type
      }
    })
      .then(resp => {
        if (!resp.data) {
          return null
        }

        const data = resp.data[0]

        // If log2_foldchange is null, represent as 'Infinity'
        if (data.log2_foldchange == null) {
          data.log2_foldchange = 'Infinity'
        }

        return data
      })
  }
}

export { MCFService }
