"use strict";
const {useState, useEffect} = React;
// source: https://www.pluralsight.com/guides/how-to-use-static-html-with-react
const {sanitize} = DOMPurify;

function Details({item})
{
  const [embededObject, setEmbededObject] = useState("");
  /**
   * this function will fetch the HTML for the spotify widget using the url 
   * given by the item and update the embededObject to store said HTML
   */
  function fetchEmbedHTML()
  {
    const searchParams = new URLSearchParams({
      url: item.external_urls.spotify
    });

    fetch(`https://open.spotify.com/oembed?${searchParams}`)
    .then (response => {
        if( !response.ok ) { 
          throw new Error("Not 2xx response", {cause: response});
      }
      return response.json();
    })
    .then( obj => {
      setEmbededObject(obj);
    })
    .catch( err => {
      console.error("3)Error:", err);
    });
  }

  if (!item)
  {
    return(
      <main>
        <h2>No item selected!</h2>
      </main>
    )
  }
  else
  {  
    fetchEmbedHTML();
    return(
      <main>
          <h2>{item.name} - {item.album.artists[0].name} </h2>
          <div className="artist_info">
            <figure>
              <img src={item.album.images[0].url} alt={item.album.name} />

              <figcaption><a href={item.external_urls.spotify}>View the full {item.album.name} album here</a></figcaption>
            </figure>
            <article>
              <h3>About the album</h3>
              <dl>
                <dt>Release date: </dt>
                <dd>{item.album.release_date}</dd>
                <dt>Total tracks: </dt>
                <dd>{item.album.total_tracks}</dd>
              </dl>
              <h3>About the song</h3>
              <dl>
                <dt>Duration: </dt>
                <dd>{Math.floor(item.duration_ms / 60000)}:{Math.round(item.duration_ms%60000/1000, 2) < 10 
                ? `0${Math.round(item.duration_ms%60000/1000, 2)}` 
                : Math.round(item.duration_ms%60000/1000, 2)}</dd>
                <dt>Artist(s): </dt>
                <dd>{item.artists.map((artist) => `${artist.name}`).join(", ")}</dd>
              </dl>
              <div dangerouslySetInnerHTML={{__html : sanitize(`${embededObject.html}`, {ALLOWED_TAGS: ["iframe"]} )}}></div>
            </article>
          </div>
      </main>
    )
  }
}

function ListItem({track, boldAndFindItem, saveFavourite})
{
  return(
    <li key={track.id} id={track.id}  onClick={(e) => boldAndFindItem(e, track)}>{track.name} - {track.album.artists[0].name} 
       <button className="favourite" onClick={(e) => saveFavourite(track)}>&#9745;</button>
    </li>
  )
}

// spotify API usage code sourse: https://dev.to/dom_the_dev/how-to-use-the-spotify-api-in-your-react-js-app-50pn
function App()
{
  const [curSearchTerm, setCurSearchTerm] = useState("");
  const [curViewedItem, setViewedItem] = useState(null);
  const [searchTerms, setSearchTerms] = useState([]);
  const [favourites, setFavourites] = useState(JSON.parse(localStorage.getItem("favourites")) || []
  .forEach((item) => setFavourites(favourites.concat(item))) || []);

  /*************** code used from source above starts here ********************/
  const CLIENT_ID = "";
  const REDIRECT_URI = "";
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
  const RESPONSE_TYPE = "token";

  const [token, setToken] = useState("");

  useEffect(() => {
    const hash = window.location.hash
    let token = window.localStorage.getItem("token")
    if (!token && hash) {
        token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1]

        window.location.hash = ""
        window.localStorage.setItem("token", token)
    }
    setToken(token)
}, [])

const logout = () => {
    setToken("")
    window.localStorage.removeItem("token")
}

/*************** code used from source above ends here ********************/

  /**
   * this function fetches the tracks using the current search term typed in the input box
   */
  function fetchData() {
    const searchParams = new URLSearchParams({
      q: curSearchTerm,
      type: "track"
    });

    fetch(`https://api.spotify.com/v1/search?${searchParams.toString()}`, {
      headers : {
        Authorization: `Bearer ${token}`
      }
    })
    .then( response => { 
        if( !response.ok ) { 
            throw new Error("Not 2xx response", {cause: response});
        }
        return response.json();
    })
    .then( obj => {
      setSearchTerms(obj.tracks.items);
        
    })
    .catch( err => {
        console.error("3)Error:", err);
    });
  }
  /**
   * this function will bold the li clicked and set the viewed item to the item clicked
   * @param {Event} e 
   * @param {Object} item 
   */
  function boldAndFindItem(e, item) {

    let selected = document.querySelector(".selected");
    
    // if (!!selected && e.target.id !== selected.id)
    // {
    //   selected.classList.remove('selected');
    // }
    // e.target.classList.add('selected');
    e.target.className = !selected || e.target.id === selected.id ? "selected" : "";
    setViewedItem(item);
  }

  /**
   * this function will save a particular item (track object) into the favourites 
   * and update local storage accordingly
   * @param {Object} track 
   */
  function saveFavourite(track)
  {
    if (favourites.includes(track))
    {
      localStorage.setItem("favourites", JSON.stringify(favourites.toSpliced(favourites.indexOf(track), 1)));
      setFavourites(favourites.toSpliced(favourites.indexOf(track), 1));
    }
    else 
    {
      localStorage.setItem("favourites", JSON.stringify(favourites.concat(track)));
      setFavourites(favourites.concat(track));
    }

  }

  return (
    <div className="wrapper">
      <div id="search-list">
        <header>
          <h1>Spotify music API</h1>
            <input type="text" name="song" id="song" value={curSearchTerm} onInput={(e) => setCurSearchTerm(e.target.value)} />
            <button type="submit" onClick={(e) => {
              fetchData();
              }}>Search</button>
          <ul>
            {searchTerms.map((item) => <ListItem track={item} boldAndFindItem={boldAndFindItem} saveFavourite={saveFavourite} /> )}
          </ul>
        </header>
        <footer>
          <div id="favourite-box">Your favourites:
            <ul>
              {favourites.map((item) => <ListItem track={item} boldAndFindItem={boldAndFindItem} saveFavourite={saveFavourite}/> )}
            </ul>
          </div>
            <div className="App">
            Implementation by Bianca Rossetti
              {!token ?
                  <a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`}>Login
                      to Spotify</a>
                  : <button onClick={logout}>Logout</button>}
            </div>
        </footer>
      </div>
      <Details item={curViewedItem}/>
    </div>
  );
}

ReactDOM.render(
  <App />,
  document.querySelector("#root-react")       
);
