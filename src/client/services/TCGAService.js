import axios from 'axios'
import _ from 'lodash'

export class TCGAService {
  study = 'tcga'

  samples = ['tcga']

  subsets = ['rbp', 'u12']

  types = ['median']

  getBellCurve = (type, subsets = []) => {
    // Generate requests for each sample
    const requests = _.map(this.samples, sample => {
      return axios.get('/api/bellcurve', {
        params: {
          study: this.study,
          sample: sample,
          subsets: this.subsets,
          type: type
        }
      })
    })

    const data = []
    return axios.all(requests).then(
      axios.spread((...responses) => {
        _.each(responses, resp => {
          const sample = resp.config.params.sample
          data.push({ sample: sample, data: resp.data })
        })

        return data
      })
    )
  }

  getVertical = (gene, type, subsets = []) => {
    return axios
      .get('/api/vertical', {
        params: {
          study: this.study,
          samples: this.samples,
          gene: gene.toUpperCase(), // DB stores gene names in UPPERCASE,
          subsets: subsets,
          type: type
        }
      })
      .then(resp => {
        if (!resp.data.length) {
          return null
        }

        return resp.data[0]
      })
  }

  getCorrelations = (gene, dataset, min, max) => {
    return axios
      .get('/api/correlations', {
        params: {
          study: this.study,
          table: dataset.toLowerCase() + '_rvalues',
          gene: gene.toUpperCase(), // DB stores gene names in UPPERCASE
          min: min === '' ? null : min,
          max: max === '' ? null : max
        }
      })
      .then(resp => {
        if (!resp.data.length) {
          return null
        }

        return resp.data
      })
  }
}
