// データの読み込み
let artists = [];
let albums = [];
let filteredAlbums = [];

// ページ読み込み完了時に実行
document.addEventListener('DOMContentLoaded', function() {
    // データの取得
    fetch('data/albums.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('データの読み込みに失敗しました');
            }
            return response.json();
        })
        .then(data => {
            artists = data.artists;
            albums = data.albums;
            filteredAlbums = [...albums]; // 初期状態ではすべてのアルバムを表示
            
            // アーティストフィルターの設定
            setupArtistFilter();
            
            // 年フィルターの設定
            setupYearFilter();
            
            // アルバム一覧の表示（年ごと）
            renderAlbumsByYear();
        })
        .catch(error => {
            console.error('エラー:', error);
            document.getElementById('albums-container').innerHTML = `
                <div class="error-message">
                    <p>データの読み込みに失敗しました。</p>
                    <p>エラー: ${error.message}</p>
                </div>
            `;
        });
    
    // モーダルの閉じるボタン
    const closeButton = document.querySelector('.close-button');
    closeButton.addEventListener('click', closeModal);
    
    // モーダルの外側をクリックしたら閉じる
    const modal = document.getElementById('album-modal');
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
});

// アーティストフィルターの設定
function setupArtistFilter() {
    const artistFilter = document.getElementById('artist-filter');
    
    // 重複なしのアーティストリストを作成
    const uniqueArtists = [...new Set(artists.map(artist => artist.id))];
    
    // フィルターにオプションを追加
    uniqueArtists.forEach(artistId => {
        const artist = artists.find(a => a.id === artistId);
        const option = document.createElement('option');
        option.value = artistId;
        option.textContent = artist.name;
        artistFilter.appendChild(option);
    });
    
    // フィルター変更時のイベント
    artistFilter.addEventListener('change', applyFilters);
}

// 年フィルターの設定
function setupYearFilter() {
    const yearFilter = document.getElementById('year-filter');
    
    // 重複なしの年リストを作成し、ソート
    const uniqueYears = [...new Set(albums.map(album => album.year))].sort();
    
    // フィルターにオプションを追加
    uniqueYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
    
    // フィルター変更時のイベント
    yearFilter.addEventListener('change', applyFilters);
}

// フィルターの適用
function applyFilters() {
    const artistFilter = document.getElementById('artist-filter');
    const yearFilter = document.getElementById('year-filter');
    
    const selectedArtist = artistFilter.value;
    const selectedYear = yearFilter.value;
    
    // 両方のフィルターを適用
    filteredAlbums = albums.filter(album => {
        const artistMatch = selectedArtist === 'all' || album.artistId.toString() === selectedArtist;
        const yearMatch = selectedYear === 'all' || album.year.toString() === selectedYear;
        return artistMatch && yearMatch;
    });
    
    // アルバム一覧を再描画（年ごと）
    renderAlbumsByYear();
}

// アルバムを年ごとにグループ化する関数
function groupAlbumsByYear(albums) {
    const groupedAlbums = {};
    
    albums.forEach(album => {
        const year = album.year;
        
        // グループが存在しなければ初期化
        if (!groupedAlbums[year]) {
            groupedAlbums[year] = [];
        }
        
        // アルバムをそのグループに追加
        groupedAlbums[year].push(album);
    });
    
    return groupedAlbums;
}

// 年ごとにアルバム一覧を描画
function renderAlbumsByYear() {
    const container = document.getElementById('albums-container');
    container.innerHTML = ''; // コンテナをクリア
    
    if (filteredAlbums.length === 0) {
        container.innerHTML = '<p class="no-results">該当するアルバムがありません</p>';
        return;
    }
    
    // アルバムを年ごとにグループ化
    const groupedAlbums = groupAlbumsByYear(filteredAlbums);
    
    // 年を降順（最新の年から）でソート
    const years = Object.keys(groupedAlbums).sort((a, b) => b - a);
    
    // 各年ごとにセクションを作成
    years.forEach(year => {
        // 年のセクションを作成
        const yearSection = document.createElement('section');
        yearSection.className = 'year-section';
        container.appendChild(yearSection);
        
        // 年の見出しを作成
        const yearHeader = document.createElement('h2');
        yearHeader.className = 'year-header';
        yearHeader.textContent = year;
        yearSection.appendChild(yearHeader);
        
        // この年のアルバム用のグリッドを作成
        const albumsGrid = document.createElement('div');
        albumsGrid.className = 'albums-grid';
        yearSection.appendChild(albumsGrid);
        
        // アルバムを表示
        groupedAlbums[year].forEach(album => {
            const artist = artists.find(a => a.id === album.artistId);
            
            const albumCard = document.createElement('div');
            albumCard.className = 'album-card';
            albumCard.innerHTML = `
                <img src="${album.cover}" alt="${album.title}" class="album-cover">
                <div class="album-info">
                    <h3 class="album-title">${album.title}</h3>
                    <p class="album-artist">${artist ? artist.name : 'Unknown'}</p>
                </div>
            `;
            
            // アルバムカードをクリックしたときの処理
            albumCard.addEventListener('click', () => openAlbumDetails(album));
            
            albumsGrid.appendChild(albumCard);
        });
    });
}

// アルバム詳細モーダルを開く
function openAlbumDetails(album) {
    const artist = artists.find(a => a.id === album.artistId);
    
    // モーダルの内容を設定
    document.getElementById('modal-cover').src = album.cover;
    document.getElementById('modal-title').textContent = album.title;
    document.getElementById('modal-artist').textContent = artist ? artist.name : 'Unknown';
    document.getElementById('modal-year').textContent = `${album.year}年リリース`;
    document.getElementById('modal-spotify').href = album.spotifyUrl;
    
    // 曲リストを設定
    const tracksList = document.getElementById('modal-tracks');
    tracksList.innerHTML = '';
    
    album.tracks.forEach(track => {
        const li = document.createElement('li');
        li.textContent = track;
        tracksList.appendChild(li);
    });
    
    // モーダルを表示
    document.getElementById('album-modal').style.display = 'block';
}

// モーダルを閉じる
function closeModal() {
    document.getElementById('album-modal').style.display = 'none';
}