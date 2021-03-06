import React, { Component } from "react";
import PropTypes from "prop-types";
import { sortBy } from "lodash";
import className from "classnames";
import "./App.css";

const DEFAULT_QUERY = "redux";
const DEFAULT_HPP = "100";

const PATH_BASE = "https://hn.algolia.com/api/v1";
const PATH_SEARCH = "/search";
const PARAM_SEARCH = "query=";
const PARAM_PAGE = "page=";
const PARAM_HPP = "hitsPerPage=";

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, "title"),
  AUTHOR: list => sortBy(list, "author"),
  COMMENTS: list => sortBy(list, "num_comments").reverse(),
  POINTS: list => sortBy(list, "points").reverse()
};

const updatedSearchTopStoriesState = (hits, page) => (prevState) => {
  const { searchKey, results} = prevState;

  const oldHits =
    results && results[searchKey] ? results[searchKey].hits : [];

  const updatedHits = [...oldHits, ...hits];
  
  return {
    results: {
      ...results,
      [searchKey]: {hits: updatedHits, page}
    },
    isLoading: false
  };
};

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      results: null,
      searchKey: "",
      searchTerm: DEFAULT_QUERY,
      error: null,
      isLoading: false
    };

    this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
  }

  needsToSearchTopStories(searchTerm) {
    return !this.state.results[searchTerm];
  }

  onSearchSubmit(event) {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });

    if (this.needsToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm);
    }
    event.preventDefault();
  }

  setSearchTopStories(result) {
    const { hits, page } = result;
    this.setState(updatedSearchTopStoriesState(hits, page));
  }

  fetchSearchTopStories(searchTerm, page = 0) {
    this.setState({ isLoading: true });

    fetch(
      `${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`
    )
      .then(response => response.json())
      .then(result => this.setSearchTopStories(result))
      .catch(e => this.setState({ error: e }));
  }

  componentDidMount() {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });
    this.fetchSearchTopStories(searchTerm);
  }

  onDismiss(id) {
    const { searchKey, results } = this.state;
    const { hits, page } = results[searchKey];

    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);

    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page }
      }
    });
  }

  onSearchChange(event) {
    this.setState({ searchTerm: event.target.value });
  }

  render() {
    const { searchTerm, results, searchKey, error, isLoading } = this.state;
    const page =
      (results && results[searchKey] && results[searchKey].page) || 0;
    const list =
      (results && results[searchKey] && results[searchKey].hits) || [];

    return (
      <div className="page">
        <div className="interactions">
          <Search
            value={searchTerm}
            onChange={this.onSearchChange}
            onSubmit={this.onSearchSubmit}
          >
            Search
          </Search>
        </div>
        {error ? (
          <div className="interactions">
            <p>Something went wrong.</p>
          </div>
        ) : (
          <Table list={list} onDismiss={this.onDismiss} />
        )}
        <div className="interactions">
          <ButtonWithLoading
            isLoading={isLoading}
            onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}
          >
            More...
          </ButtonWithLoading>
        </div>
      </div>
    );
  }
}

class Search extends Component {
  componentDidMount() {
    if (this.input) {
      this.input.focus();
    }
  }

  render() {
    const { value, onChange, onSubmit, children } = this.props;

    return (
      <form onSubmit={onSubmit}>
        <input
          type="text"
          value={value}
          onChange={onChange}
          ref={node => {
            this.input = node;
          }}
        />
        <button type="submit">{children}</button>
      </form>
    );
  }
}

// ES6 类形式
class Table extends Component {
  constructor(props) {
    super(props);

    this.state = { sortKey: "NONE", isSortReverse: false };

    this.onSort = this.onSort.bind(this);
  }

  onSort(sortKey) {
    const isSortReverse =
      this.state.sortKey === sortKey && !this.state.isSortReverse;
    this.setState({ sortKey, isSortReverse });
  }

  render() {
    const largeColumn = {
      width: "40%"
    };

    const midColumn = {
      width: "30%"
    };
    const smallColumn = {
      width: "10%"
    };

    const { list, onDismiss } = this.props;
    const { sortKey, isSortReverse } = this.state;

    const sortedList = SORTS[sortKey](list);
    const reversedSortedList = isSortReverse
      ? sortedList.reverse()
      : sortedList;

    return (
      <div className="table">
        <div className="table-header">
          <span style={{ width: "40%" }}>
            <Sort
              sortKey={"TITLE"}
              activedSortKey={sortKey}
              onSort={this.onSort}
            >
              Title
            </Sort>
          </span>
          <span style={{ width: "30%" }}>
            <Sort
              sortKey={"AUTHOR"}
              activedSortKey={sortKey}
              onSort={this.onSort}
            >
              Author
            </Sort>
          </span>
          <span style={{ width: "10%" }}>
            <Sort
              sortKey={"COMMENTS"}
              activedSortKey={sortKey}
              onSort={this.onSort}
            >
              Comments
            </Sort>
          </span>
          <span style={{ width: "10%" }}>
            <Sort
              sortKey={"POINTS"}
              activedSortKey={sortKey}
              onSort={this.onSort}
            >
              Points
            </Sort>
          </span>
          <span style={{ width: "10%" }}>Archive</span>
        </div>
        {reversedSortedList.map(item => (
          <div key={item.objectID} className="table-row">
            <span style={largeColumn}>
              <a href={item.url}>{item.title}</a>
            </span>
            <span style={midColumn}>{item.author}</span>
            <span style={smallColumn}>{item.num_comments}</span>
            <span style={smallColumn}>{item.points}</span>
            <span style={smallColumn}>
              <Button
                onClick={() => onDismiss(item.objectID)}
                className="button-inline"
              >
                Dismiss
              </Button>
            </span>
          </div>
        ))}
      </div>
    );
  }
}

// 函数式无状态组件形式
// const Table = ({ list, sortKey, isSortReverse, onSort, onDismiss }) => {
//   const largeColumn = {
//     width: "40%"
//   };

//   const midColumn = {
//     width: "30%"
//   };
//   const smallColumn = {
//     width: "10%"
//   };

//   const sortedList = SORTS[sortKey](list);
//   const reversedSortedList = isSortReverse ? sortedList.reverse() : sortedList;

//   return (
//     <div className="table">
//       <div className="table-header">
//         <span style={{ width: "40%" }}>
//           <Sort sortKey={"TITLE"} activedSortKey={sortKey} onSort={onSort}>
//             Title
//           </Sort>
//         </span>
//         <span style={{ width: "30%" }}>
//           <Sort sortKey={"AUTHOR"} activedSortKey={sortKey} onSort={onSort}>
//             Author
//           </Sort>
//         </span>
//         <span style={{ width: "10%" }}>
//           <Sort sortKey={"COMMENTS"} activedSortKey={sortKey} onSort={onSort}>
//             Comments
//           </Sort>
//         </span>
//         <span style={{ width: "10%" }}>
//           <Sort sortKey={"POINTS"} activedSortKey={sortKey} onSort={onSort}>
//             Points
//           </Sort>
//         </span>
//         <span style={{ width: "10%" }}>Archive</span>
//       </div>
//       {reversedSortedList.map(item => (
//         <div key={item.objectID} className="table-row">
//           <span style={largeColumn}>
//             <a href={item.url}>{item.title}</a>
//           </span>
//           <span style={midColumn}>{item.author}</span>
//           <span style={smallColumn}>{item.num_comments}</span>
//           <span style={smallColumn}>{item.points}</span>
//           <span style={smallColumn}>
//             <Button
//               onClick={() => onDismiss(item.objectID)}
//               className="button-inline"
//             >
//               Dismiss
//             </Button>
//           </span>
//         </div>
//       ))}
//     </div>
//   );
// };

Table.PropTypes = {
  list: PropTypes.arrayOf(
    PropTypes.shape({
      objectID: PropTypes.string.isRequired,
      author: PropTypes.string,
      url: PropTypes.string,
      num_comments: PropTypes.number,
      points: PropTypes.number
    })
  ).isRequired,
  onDismiss: PropTypes.func.isRequired
};

const Sort = ({ sortKey, activedSortKey, onSort, children }) => {
  const sortClass = className("button-inline", {
    "button-active": sortKey === activedSortKey
  });

  return (
    <Button onClick={() => onSort(sortKey)} className={sortClass}>
      {children}
    </Button>
  );
};

const Button = ({ onClick, className, children }) => {
  // doing something

  return (
    <button onClick={onClick} className={className} type="button">
      {children}
    </button>
  );
};

const Loading = () => <div>Loading...</div>;

const withLoading = Component => ({ isLoading, ...rest }) =>
  isLoading ? <Loading /> : <Component {...rest} />;

const ButtonWithLoading = withLoading(Button);

Button.defaultProps = {
  className: ""
};

Button.PropTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

export default App;

export { Button, Search, Table };
