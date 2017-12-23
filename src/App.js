import React, { Component } from 'react'
import './App.css'
import ReactTable from 'react-table'
import 'react-table/react-table.css'
import queryString from 'query-string'
import axios from 'axios'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      error: null,
      reportData: null,
      report: 'stats.top10',
      categories: [],
      subcategories: [],
      category: null,
      subcategory: null,
      title: '',
      loading: true
    }
  }

  componentDidMount() {
    const qs = queryString.parse(window.location.search)
    const { report = this.state.report } = qs
    this.loadReport(`/${report}.json`)

    const title = report === 'stats.top10' ? 'Top 10 Requests' : 'All Requests'
    this.setState({report, title})
  }

  loadReport = async (name) => {
    try {
      const res = await axios.get(name)

      let categories
      let subcategories
      let category
      let reportData = {}
      if (this.state.report === 'stats') {
        categories = Object.keys(res.data)
        categories.forEach(key => {
          reportData[key] = res.data[key].reduce((result, value) => {
            result[value.date] = value.stats
            return result
          }, {})
        })
        console.log(reportData)
        category = categories.length > 0 ? categories[0] : null
        subcategories = Object.keys(reportData[category]).sort().reverse()
      } else {
        reportData = res.data
        categories = Object.keys(res.data)
        category = categories.length > 0 ? categories[0] : null
        subcategories = []
      }

      const subcategory = subcategories.length > 0 ? subcategories[0] : null

      this.setState({reportData,
        loading: false, categories, category,
        subcategories, subcategory })
    } catch (error) {
      this.setState({ error, loading: false })
    }
  }

  get = (url, defaultValue) => {
    return axios.get(url).then(resp => resp.data).catch(e => {
      if (defaultValue) {
        return defaultValue
      }
      throw e
    })
  }

  handleCategoryChange = (evt) => {
    const { report, reportData } = this.state
    const category = evt.target.value
    if (report === 'stats') {
      const subcategories = Object.keys(reportData[category]).sort().reverse()
      const subcategory = subcategories[0]
      this.setState({category, subcategories, subcategory})
    } else {
      this.setState({category})
    }
  }

  handleSubcategoryChange = (evt) => {
    const subcategory = evt.target.value
    this.setState({subcategory})
  }

  renderControls = () => {
    const { categories, category, subcategories, subcategory } = this.state

    let subcategorySelect = null
    if (subcategories.length > 0) {
      subcategorySelect = (
        <select
          defaultValue={subcategory}
          onChange={this.handleSubcategoryChange}>
          {subcategories.map(
            val => <option key={val}>{val}</option>
          )}
        </select>
      )
    }
    return (
      <div className="filterSelect">
        <select
          defaultValue={category}
          onChange={this.handleCategoryChange}>
          {categories.map(
            val => <option key={val}>{val}</option>
          )}
        </select>
        {subcategorySelect}
      </div>
    )
  }

  render () {
    const { loading, error, reportData, title, report, category, subcategory } = this.state

    if (loading) {
      return (
        <div className='App'>
          Loading...
        </div>
      )
    } else if (error) {
      console.error(error)
      return (
        <div className='App'>
          Unexpected Error!
        </div>
      )
    }

    const columns = [{
      Header: 'Content',
      accessor: 'resource'
    }, {
      Header: 'Hits',
      accessor: 'count',
      style: {textAlign: 'center'}
    }]

    return (
      <div className='App'>
        <div className='header'>
          <span>{title}</span>
          {this.renderControls()}
        </div>
        <ReactTable
          data={report === 'stats' ? reportData[category][subcategory] : reportData[category]}
          columns={columns}
          defaultPageSize={10}
          pageSizeOptions={[10, 20, 100]}
        />
        <div className='footer'>
          Download <a href={`/${report}.json`}>report</a>
        </div>
      </div>
    )
  }
}

export default App
