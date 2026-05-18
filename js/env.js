(function () {
  var CFG      = window.ENV_CONFIG || {};
  var slug     = CFG.slug     || '';
  var features = CFG.features || [];
  var members  = CFG.members  || [];
  var storedPw = null;

  var FEATURE_LABELS = {
    blackout: 'Black Out Counter',
    awards:   'Awards',
    chores:   'Chore Chart',
    board:    'Message Board',
    polls:    'Polls',
    scores:   'Scores'
  };

  /* ── Helpers ── */
  function esc(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function apiGet(path) {
    return fetch('/api/env/' + slug + '/' + path).then(function(r){ return r.json(); });
  }
  function apiPost(path, body) {
    var payload = Object.assign({}, body || {}, { pw: storedPw });
    return fetch('/api/env/' + slug + '/' + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(r){ return r.json(); });
  }
  function apiPut(path, body) {
    var payload = Object.assign({}, body || {}, { pw: storedPw });
    return fetch('/api/env/' + slug + '/' + path, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(r){ return r.json(); });
  }
  function apiDel(path) {
    return fetch('/api/env/' + slug + '/' + path + '?pw=' + encodeURIComponent(storedPw || ''), {
      method: 'DELETE'
    }).then(function(r){ return r.json(); });
  }

  /* ── Gate ── */
  function initGate() {
    var gateEl    = document.getElementById('env-gate');
    var contentEl = document.getElementById('env-content');
    var saved     = sessionStorage.getItem('env_' + slug);

    if (saved) {
      storedPw = saved;
      if (gateEl)    gateEl.style.display    = 'none';
      if (contentEl) { contentEl.style.display = 'block'; initContent(); }
      return;
    }

    var input = document.getElementById('env-gate-pw');
    var btn   = document.getElementById('env-gate-btn');
    var errEl = document.getElementById('env-gate-error');

    function tryAuth() {
      var pw = input ? input.value.trim() : '';
      if (!pw) return;
      if (errEl) errEl.style.display = 'none';
      fetch('/api/env/' + slug + '/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pw: pw })
      })
      .then(function(r){ return r.json(); })
      .then(function(d) {
        if (d.ok) {
          storedPw = pw;
          sessionStorage.setItem('env_' + slug, pw);
          if (gateEl)    gateEl.style.display    = 'none';
          if (contentEl) { contentEl.style.display = 'block'; initContent(); }
        } else {
          if (errEl) errEl.style.display = 'block';
          if (input) { input.value = ''; input.focus(); }
        }
      })
      .catch(function() {
        if (errEl) { errEl.textContent = 'Network error — try again.'; errEl.style.display = 'block'; }
      });
    }

    if (btn)   btn.addEventListener('click', tryAuth);
    if (input) {
      input.addEventListener('keydown', function(e){ if (e.key === 'Enter') tryAuth(); });
      setTimeout(function(){ input.focus(); }, 100);
    }
  }

  /* ── Content ── */
  function initContent() {
    buildTabs();
    if (features.length > 0) loadFeature(features[0]);
  }

  function buildTabs() {
    var tabsEl   = document.getElementById('env-tabs');
    var panelsEl = document.getElementById('env-panels');
    if (!tabsEl || !panelsEl) return;
    features.forEach(function(f, i) {
      var btn = document.createElement('button');
      btn.className = 'rh-tab-btn' + (i === 0 ? ' active' : '');
      btn.dataset.feature = f;
      btn.textContent = FEATURE_LABELS[f] || f;
      btn.addEventListener('click', function() {
        tabsEl.querySelectorAll('.rh-tab-btn').forEach(function(b){ b.classList.remove('active'); });
        panelsEl.querySelectorAll('.env-panel').forEach(function(p){ p.classList.remove('active'); });
        btn.classList.add('active');
        var panel = document.getElementById('env-panel-' + f);
        if (panel) panel.classList.add('active');
        loadFeature(f);
      });
      tabsEl.appendChild(btn);

      var panel = document.createElement('div');
      panel.id = 'env-panel-' + f;
      panel.className = 'env-panel' + (i === 0 ? ' active' : '');
      panel.innerHTML = '<div class="rh-chart-wrap"><p class="env-empty">Loading…</p></div>';
      panelsEl.appendChild(panel);
    });
  }

  function loadFeature(f) {
    if      (f === 'blackout') renderBlackout();
    else if (f === 'awards')   renderAwards();
    else if (f === 'chores')   renderChores();
    else if (f === 'board')    renderBoard();
    else if (f === 'polls')    renderPolls();
    else if (f === 'scores')   renderScores();
  }

  /* ── Blackout ── */
  function renderBlackout() {
    var panel = document.getElementById('env-panel-blackout');
    if (!panel) return;
    panel.innerHTML =
      '<div class="rh-chart-wrap">' +
        '<div class="rh-chart-header">' +
          '<div class="rh-chart-title"><span></span>Black Out Counter</div>' +
          '<button class="rh-refresh-btn" id="bo-refresh">Refresh</button>' +
        '</div>' +
        '<div class="rh-bars" id="bo-bars"></div>' +
        '<div class="rh-bar-labels" id="bo-labels"></div>' +
      '</div>';

    document.getElementById('bo-refresh').addEventListener('click', loadBlackout);
    loadBlackout();

    function loadBlackout() {
      apiGet('blackout').then(drawBars).catch(function() {
        var el = document.getElementById('bo-bars');
        if (el) el.innerHTML = '<p style="color:rgba(255,255,255,0.3)">Could not load data.</p>';
      });
    }

    function drawBars(data) {
      var barsEl   = document.getElementById('bo-bars');
      var labelsEl = document.getElementById('bo-labels');
      if (!barsEl || !labelsEl) return;
      var maxCount = Math.max.apply(null, data.map(function(d){ return d.count; })) || 1;
      barsEl.innerHTML = labelsEl.innerHTML = '';

      data.forEach(function(entry, i) {
        var isTop = entry.count === maxCount && maxCount > 0;
        var pct   = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;

        var col = document.createElement('div'); col.className = 'rh-bar-col';
        var countEl = document.createElement('div');
        countEl.className = 'rh-bar-count'; countEl.textContent = entry.count;

        var bar = document.createElement('div');
        bar.className = 'rh-bar' + (isTop ? ' top' : '');
        bar.style.height = '0%'; bar.title = entry.name + ': ' + entry.count;

        var btns = document.createElement('div'); btns.className = 'rh-bar-btns';

        var plus = document.createElement('button'); plus.className = 'rh-bar-plus'; plus.textContent = '+';
        plus.addEventListener('click', function(e) {
          e.stopPropagation();
          if (!confirm('Add +1 for ' + entry.name + '?')) return;
          apiPost('blackout/increment', { name: entry.name }).then(loadBlackout);
        });

        var minus = document.createElement('button'); minus.className = 'rh-bar-minus'; minus.textContent = '−';
        minus.addEventListener('click', function(e) {
          e.stopPropagation();
          if (!confirm('Remove −1 for ' + entry.name + '?')) return;
          apiPost('blackout/decrement', { name: entry.name }).then(loadBlackout);
        });

        btns.appendChild(minus); btns.appendChild(plus);
        bar.appendChild(btns);
        col.appendChild(countEl); col.appendChild(bar);
        barsEl.appendChild(col);

        var lbl = document.createElement('div');
        lbl.className = 'rh-bar-label' + (isTop ? ' top' : '');
        var parts = entry.name.split(' ');
        lbl.textContent = parts[0] + '\n' + parts.slice(1).join(' ');
        labelsEl.appendChild(lbl);

        setTimeout(function(){ bar.style.height = pct + '%'; }, 60 + i * 80);
      });
    }
  }

  /* ── Awards ── */
  function renderAwards() {
    var panel = document.getElementById('env-panel-awards');
    if (!panel) return;
    apiGet('awards').then(function(awards) {
      var memberOpts = members.map(function(m){ return '<option value="' + esc(m) + '">' + esc(m) + '</option>'; }).join('');
      var colorOpts  = ['gold','blue','red','green'].map(function(c){
        return '<option value="' + c + '">' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>';
      }).join('');

      var cardsHtml = '';
      if (awards.length > 0) {
        cardsHtml = '<div class="rh-awards-grid">' + awards.map(function(a) {
          return '<div class="rh-award-card ' + esc(a.color || 'blue') + '">' +
            '<span class="rh-award-icon">' + esc(a.icon || '🏆') + '</span>' +
            '<div class="rh-award-label">' + esc(a.label) + '</div>' +
            '<div class="rh-award-name">' + esc(a.winner || '—') + '</div>' +
          '</div>';
        }).join('') + '</div>';
      } else {
        cardsHtml = '<p class="env-empty" style="margin-bottom:32px">No awards set yet. Add some below.</p>';
      }

      var editorRows = awards.map(function(a, i){ return buildAwardRow(i, a, memberOpts, colorOpts); }).join('');

      panel.innerHTML =
        '<div class="rh-chart-wrap">' +
          '<div class="rh-awards-title">Awards</div>' +
          cardsHtml +
          '<div class="env-add-section">' +
            '<div class="env-add-title">Edit Awards</div>' +
            '<div id="awards-editor">' + editorRows + '</div>' +
            '<button id="awards-add-row" class="env-dark-btn secondary" style="width:100%;margin-top:10px;padding:8px">+ Add Award</button>' +
            '<div style="display:flex;gap:10px;margin-top:14px;align-items:center">' +
              '<button id="awards-save" class="env-dark-btn">Save Awards</button>' +
              '<span id="awards-status" class="env-status"></span>' +
            '</div>' +
          '</div>' +
        '</div>';

      document.getElementById('awards-add-row').addEventListener('click', function() {
        var editor = document.getElementById('awards-editor');
        var div = document.createElement('div');
        div.innerHTML = buildAwardRow(editor.querySelectorAll('.awards-row').length, { icon:'🏆', label:'', winner:'', color:'gold' }, memberOpts, colorOpts);
        editor.appendChild(div.firstChild);
      });

      document.getElementById('awards-save').addEventListener('click', function() {
        var editor = document.getElementById('awards-editor');
        var status = document.getElementById('awards-status');
        var collected = [];
        editor.querySelectorAll('.awards-row').forEach(function(row) {
          var icon   = row.querySelector('[data-f="icon"]').value.trim();
          var label  = row.querySelector('[data-f="label"]').value.trim();
          var winner = row.querySelector('[data-f="winner"]').value;
          var color  = row.querySelector('[data-f="color"]').value;
          if (label) collected.push({ icon: icon || '🏆', label: label, winner: winner, color: color });
        });
        status.textContent = 'Saving…';
        apiPut('awards', { awards: collected }).then(function(d) {
          if (d.ok) {
            status.textContent = 'Saved!';
            setTimeout(function(){ renderAwards(); }, 800);
          } else { status.textContent = d.error || 'Error.'; }
        });
      });
    });
  }

  function buildAwardRow(i, a, memberOpts, colorOpts) {
    var selectedColor = a.color || 'gold';
    var co = ['gold','blue','red','green'].map(function(c){
      return '<option value="' + c + '"' + (c === selectedColor ? ' selected' : '') + '>' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>';
    }).join('');
    var mo = '<option value="">— None —</option>' + members.map(function(m){
      return '<option value="' + esc(m) + '"' + (m === a.winner ? ' selected' : '') + '>' + esc(m) + '</option>';
    }).join('');
    return '<div class="awards-row">' +
      '<input class="env-dark-input" data-f="icon" value="' + esc(a.icon || '🏆') + '" placeholder="🏆" style="width:58px;text-align:center;font-size:20px;flex:0 0 58px">' +
      '<input class="env-dark-input" data-f="label" value="' + esc(a.label || '') + '" placeholder="Award name…" style="flex:2;min-width:120px">' +
      '<select class="env-dark-select" data-f="winner" style="flex:1;min-width:100px">' + mo + '</select>' +
      '<select class="env-dark-select" data-f="color" style="flex:0 0 90px">' + co + '</select>' +
      '<button onclick="this.closest(\'.awards-row\').remove()" style="background:none;border:none;color:rgba(255,255,255,0.25);font-size:20px;cursor:pointer;padding:0 6px;flex-shrink:0">×</button>' +
    '</div>';
  }

  /* ── Chores ── */
  function renderChores() {
    var panel = document.getElementById('env-panel-chores');
    if (!panel) return;
    var memberOpts = members.map(function(m){ return '<option value="' + esc(m) + '">' + esc(m) + '</option>'; }).join('');

    panel.innerHTML =
      '<div class="rh-chart-wrap">' +
        '<div class="rh-chart-header">' +
          '<div class="rh-chart-title">Chore Chart</div>' +
          '<button class="rh-refresh-btn" id="chores-refresh">Refresh</button>' +
        '</div>' +
        '<div id="chores-list"></div>' +
        '<div class="env-add-section">' +
          '<div class="env-add-title">Add Chore</div>' +
          '<div class="env-row">' +
            '<input id="chore-task" class="env-dark-input" placeholder="Chore description…" style="flex:2;min-width:180px">' +
            '<select id="chore-assignee" class="env-dark-select" style="flex:1;min-width:120px">' +
              '<option value="">— Anyone —</option>' + memberOpts +
            '</select>' +
            '<button id="chore-add" class="env-dark-btn">Add</button>' +
          '</div>' +
          '<p id="chore-status" class="env-status"></p>' +
        '</div>' +
      '</div>';

    document.getElementById('chores-refresh').addEventListener('click', loadChores);
    document.getElementById('chore-task').addEventListener('keydown', function(e){ if (e.key === 'Enter') addChore(); });
    document.getElementById('chore-add').addEventListener('click', addChore);
    loadChores();

    function loadChores() {
      apiGet('chores').then(function(chores) {
        var list = document.getElementById('chores-list');
        if (!list) return;
        if (!chores.length) { list.innerHTML = '<p class="env-empty">No chores yet.</p>'; return; }
        list.innerHTML = '';
        chores.forEach(function(c) {
          var item = document.createElement('div');
          item.className = 'env-chore-item' + (c.done ? ' done' : '');
          item.innerHTML =
            '<button class="env-chore-check" data-id="' + esc(c.id) + '" title="Toggle done">' + (c.done ? '✓' : '') + '</button>' +
            '<span class="env-chore-task">' + esc(c.task) + '</span>' +
            (c.assignee ? '<span class="env-chore-assignee">' + esc(c.assignee) + '</span>' : '') +
            '<button class="env-chore-del" data-id="' + esc(c.id) + '" title="Delete">×</button>';
          list.appendChild(item);
        });
        list.querySelectorAll('.env-chore-check').forEach(function(btn) {
          btn.addEventListener('click', function() {
            apiPut('chores/' + btn.dataset.id, {}).then(loadChores);
          });
        });
        list.querySelectorAll('.env-chore-del').forEach(function(btn) {
          btn.addEventListener('click', function() {
            if (!confirm('Delete this chore?')) return;
            apiDel('chores/' + btn.dataset.id).then(loadChores);
          });
        });
      });
    }

    function addChore() {
      var task     = document.getElementById('chore-task').value.trim();
      var assignee = document.getElementById('chore-assignee').value;
      var status   = document.getElementById('chore-status');
      if (!task) { status.textContent = 'Enter a chore first.'; return; }
      apiPost('chores', { task: task, assignee: assignee }).then(function(d) {
        if (d.ok) {
          document.getElementById('chore-task').value = '';
          status.textContent = '';
          loadChores();
        } else { status.textContent = d.error || 'Error adding.'; }
      });
    }
  }

  /* ── Board ── */
  var REACTIONS = ['👍','❤️','😂','🔥','😮'];

  function renderBoard() {
    var panel = document.getElementById('env-panel-board');
    if (!panel) return;
    var pendingBoardImage = null;
    var memberOpts = '<option value="Anonymous">Anonymous</option>' +
      members.map(function(m){ return '<option value="' + esc(m) + '">' + esc(m) + '</option>'; }).join('');

    panel.innerHTML =
      '<div class="rh-chart-wrap">' +
        '<div class="rh-chart-header">' +
          '<div class="rh-chart-title">Message Board</div>' +
          '<button class="rh-refresh-btn" id="board-refresh">Refresh</button>' +
        '</div>' +
        '<div id="board-messages"></div>' +
        '<div class="env-add-section">' +
          '<div class="env-add-title">New Post</div>' +
          '<textarea id="board-text" class="env-dark-textarea" placeholder="What\'s on your mind…"></textarea>' +
          '<div style="margin-top:10px;display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap">' +
            '<button type="button" id="board-img-btn" class="env-img-attach-btn">📎 Attach image<input type="file" id="board-img-input" accept="image/*" style="display:none"></button>' +
          '</div>' +
          '<div id="board-img-preview-wrap" style="display:none" class="env-img-preview-wrap">' +
            '<img id="board-img-preview" src="" alt="">' +
            '<button type="button" id="board-img-remove" class="env-img-remove">×</button>' +
          '</div>' +
          '<div class="env-row" style="margin-top:12px">' +
            '<select id="board-author" class="env-dark-select" style="flex:1">' + memberOpts + '</select>' +
            '<button id="board-post" class="env-dark-btn">Post</button>' +
          '</div>' +
          '<p id="board-status" class="env-status"></p>' +
        '</div>' +
      '</div>';

    // Image attach
    var imgBtn    = document.getElementById('board-img-btn');
    var imgInput  = document.getElementById('board-img-input');
    var imgWrap   = document.getElementById('board-img-preview-wrap');
    var imgPrev   = document.getElementById('board-img-preview');
    var imgRemove = document.getElementById('board-img-remove');

    imgBtn.addEventListener('click', function() { imgInput.click(); });
    imgInput.addEventListener('change', function() {
      var file = imgInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        pendingBoardImage = { file: file, dataUrl: e.target.result };
        imgPrev.src = e.target.result;
        imgWrap.style.display = 'inline-block';
      };
      reader.readAsDataURL(file);
    });
    imgRemove.addEventListener('click', function() {
      pendingBoardImage = null;
      imgInput.value = '';
      imgPrev.src = '';
      imgWrap.style.display = 'none';
    });

    document.getElementById('board-refresh').addEventListener('click', loadBoard);
    document.getElementById('board-post').addEventListener('click', postMessage);
    loadBoard();

    function loadBoard() {
      apiGet('board').then(function(posts) {
        var el = document.getElementById('board-messages');
        if (!el) return;
        if (!posts.length) { el.innerHTML = '<p class="env-empty">No messages yet. Post something below.</p>'; return; }
        el.innerHTML = '';
        posts.slice().reverse().forEach(function(post) {
          var div = document.createElement('div'); div.className = 'env-message';

          var myReaction = sessionStorage.getItem('react_' + slug + '_' + post.id);
          var reactHtml = '<div class="env-reactions">';
          REACTIONS.forEach(function(emoji) {
            var count = (post.reactions && post.reactions[emoji]) || 0;
            var lit   = myReaction === emoji ? ' lit' : '';
            reactHtml += '<button class="env-react-btn' + lit + '" data-post="' + esc(post.id) + '" data-emoji="' + esc(emoji) + '">' +
              emoji + (count > 0 ? '<span class="env-react-count">' + count + '</span>' : '') +
            '</button>';
          });
          reactHtml += '</div>';

          div.innerHTML =
            '<div class="env-message-header">' +
              '<span class="env-message-author">' + esc(post.author || 'Anonymous') + '</span>' +
              '<div style="display:flex;align-items:center">' +
                '<span class="env-message-date">' + esc(post.date || '') + '</span>' +
                '<button class="env-message-del" data-id="' + esc(post.id) + '" title="Delete">×</button>' +
              '</div>' +
            '</div>' +
            (post.text ? '<div class="env-message-text">' + esc(post.text) + '</div>' : '') +
            (post.image ? '<img src="' + esc(post.image) + '" class="env-message-image" alt="" onclick="this.style.maxHeight=this.style.maxHeight?\'\':\' none\'">' : '') +
            reactHtml;
          el.appendChild(div);
        });

        el.querySelectorAll('.env-react-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var postId  = btn.dataset.post;
            var emoji   = btn.dataset.emoji;
            var myKey   = 'react_' + slug + '_' + postId;
            var current = sessionStorage.getItem(myKey);

            function sendReact(e, act) {
              return fetch('/api/env/' + slug + '/board/' + postId + '/react', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emoji: e, action: act })
              }).then(function(r) { return r.json(); });
            }

            function updateBtn(b, count) {
              var countEl = b.querySelector('.env-react-count');
              if (count > 0) {
                if (countEl) { countEl.textContent = count; }
                else { var s = document.createElement('span'); s.className = 'env-react-count'; s.textContent = count; b.appendChild(s); }
              } else {
                if (countEl) countEl.parentNode.removeChild(countEl);
              }
            }

            if (current === emoji) {
              // Same emoji clicked → remove reaction
              sendReact(emoji, 'remove').then(function(d) {
                if (!d.ok) return;
                sessionStorage.removeItem(myKey);
                btn.classList.remove('lit');
                updateBtn(btn, d.count);
              });
            } else if (current) {
              // Different emoji → remove old, add new, then reload for clean state
              sendReact(current, 'remove')
                .then(function() { return sendReact(emoji, 'add'); })
                .then(function(d) {
                  if (!d.ok) return;
                  sessionStorage.setItem(myKey, emoji);
                  loadBoard();
                });
            } else {
              // No existing reaction → add
              sendReact(emoji, 'add').then(function(d) {
                if (!d.ok) return;
                sessionStorage.setItem(myKey, emoji);
                btn.classList.add('lit');
                updateBtn(btn, d.count);
              });
            }
          });
        });

        el.querySelectorAll('.env-message-del').forEach(function(btn) {
          btn.addEventListener('click', function() {
            if (!confirm('Delete this message?')) return;
            apiDel('board/' + btn.dataset.id).then(loadBoard);
          });
        });
      });
    }

    function postMessage() {
      var text   = document.getElementById('board-text').value.trim();
      var author = document.getElementById('board-author').value;
      var status = document.getElementById('board-status');
      if (!text && !pendingBoardImage) { status.textContent = 'Write something or attach an image.'; return; }

      function doPost(imagePath) {
        apiPost('board', { text: text, author: author, image: imagePath || null }).then(function(d) {
          if (d.ok) {
            document.getElementById('board-text').value = '';
            pendingBoardImage = null;
            imgInput.value = '';
            imgPrev.src = '';
            imgWrap.style.display = 'none';
            status.textContent = '';
            loadBoard();
          } else { status.textContent = 'Error posting.'; }
        });
      }

      if (pendingBoardImage) {
        status.textContent = 'Uploading image…';
        var base64 = pendingBoardImage.dataUrl.split(',')[1];
        fetch('/api/upload-image', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: pendingBoardImage.file.name, data: base64 })
        })
        .then(function(r){ return r.json(); })
        .then(function(d) {
          if (d.ok) { status.textContent = ''; doPost(d.path); }
          else { status.textContent = 'Image upload failed.'; }
        })
        .catch(function(){ status.textContent = 'Upload error.'; });
      } else {
        doPost(null);
      }
    }
  }

  /* ── Polls ── */
  function renderPolls() {
    var panel = document.getElementById('env-panel-polls');
    if (!panel) return;

    panel.innerHTML =
      '<div class="rh-chart-wrap">' +
        '<div class="rh-chart-header">' +
          '<div class="rh-chart-title">Polls</div>' +
          '<button class="rh-refresh-btn" id="polls-refresh">Refresh</button>' +
        '</div>' +
        '<div id="polls-list"></div>' +
        '<div class="env-add-section">' +
          '<div class="env-add-title">New Poll</div>' +
          '<input id="poll-question" class="env-dark-input" placeholder="Poll question…" style="width:100%;margin-bottom:10px">' +
          '<div id="poll-opts-list">' +
            '<input class="env-dark-input poll-opt" placeholder="Option 1…" style="width:100%;margin-bottom:6px">' +
            '<input class="env-dark-input poll-opt" placeholder="Option 2…" style="width:100%;margin-bottom:6px">' +
          '</div>' +
          '<div class="env-row" style="margin-top:8px">' +
            '<button id="poll-add-opt" class="env-dark-btn secondary" style="padding:8px 14px;font-size:12px">+ Option</button>' +
            '<button id="poll-create" class="env-dark-btn">Create Poll</button>' +
            '<span id="poll-status" class="env-status" style="flex:1"></span>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('polls-refresh').addEventListener('click', loadPolls);
    document.getElementById('poll-add-opt').addEventListener('click', function() {
      var list = document.getElementById('poll-opts-list');
      var n = list.querySelectorAll('.poll-opt').length + 1;
      var inp = document.createElement('input');
      inp.className = 'env-dark-input poll-opt';
      inp.placeholder = 'Option ' + n + '…';
      inp.style.cssText = 'width:100%;margin-bottom:6px';
      list.appendChild(inp);
    });
    document.getElementById('poll-create').addEventListener('click', createPoll);
    loadPolls();

    function loadPolls() {
      apiGet('polls').then(function(polls) {
        var el = document.getElementById('polls-list');
        if (!el) return;
        if (!polls.length) { el.innerHTML = '<p class="env-empty">No polls yet.</p>'; return; }
        el.innerHTML = '';
        polls.forEach(function(poll) {
          var total   = poll.options.reduce(function(s,o){ return s + (o.votes||[]).length; }, 0);
          var myVote  = sessionStorage.getItem('poll_' + slug + '_' + poll.id); // voted option index as string, or null
          var hasVoted = myVote !== null;
          var div = document.createElement('div'); div.className = 'env-poll';
          var html = '<div class="env-poll-question">' + esc(poll.question) + '</div>';
          poll.options.forEach(function(opt, oi) {
            var votes   = (opt.votes || []).length;
            var pct     = total > 0 ? Math.round((votes / total) * 100) : 0;
            var isMyPick = hasVoted && String(oi) === myVote;
            var cursor   = hasVoted ? 'default' : 'pointer';
            var highlight = isMyPick ? ' style="background:rgba(39,116,174,0.18);border-radius:6px;padding:4px 0"' : '';
            html += '<div class="env-poll-option" data-poll="' + esc(poll.id) + '" data-oi="' + oi + '" style="cursor:' + cursor + '"' + highlight + '>' +
              '<div class="env-poll-bar-wrap">' +
                '<span class="env-poll-bar-label">' + esc(opt.text) + (isMyPick ? ' ✓' : '') + '</span>' +
                '<div class="env-poll-bar-track" title="' + (hasVoted ? votes + ' vote' + (votes === 1 ? '' : 's') : 'Vote for ' + esc(opt.text)) + '">' +
                  '<div class="env-poll-bar-fill" style="width:' + pct + '%">' +
                    (pct >= 18 ? '<span class="env-poll-pct">' + pct + '%</span>' : '') +
                  '</div>' +
                '</div>' +
                (pct < 18 ? '<span class="env-poll-pct-outside">' + pct + '%</span>' : '') +
              '</div>' +
            '</div>';
          });
          html += '<div class="env-poll-meta">' +
            '<span class="env-poll-total">' + total + ' vote' + (total === 1 ? '' : 's') + (hasVoted ? ' · <em style="opacity:0.5">voted</em>' : '') + '</span>' +
            '<button class="env-poll-del" data-id="' + esc(poll.id) + '">Delete poll</button>' +
          '</div>';
          div.innerHTML = html;
          el.appendChild(div);
        });
        el.querySelectorAll('.env-poll-option').forEach(function(opt) {
          opt.addEventListener('click', function() {
            var pollId  = opt.dataset.poll;
            var oi      = parseInt(opt.dataset.oi, 10);
            var voteKey = 'poll_' + slug + '_' + pollId;
            if (sessionStorage.getItem(voteKey) !== null) return; // already voted
            apiPost('polls/' + pollId + '/vote', { optionIndex: oi }).then(function(d) {
              if (d.ok) {
                sessionStorage.setItem(voteKey, String(oi));
                loadPolls();
              }
            });
          });
        });
        el.querySelectorAll('.env-poll-del').forEach(function(btn) {
          btn.addEventListener('click', function() {
            if (!confirm('Delete this poll?')) return;
            apiDel('polls/' + btn.dataset.id).then(loadPolls);
          });
        });
      });
    }

    function createPoll() {
      var question = document.getElementById('poll-question').value.trim();
      var opts = Array.from(document.querySelectorAll('.poll-opt')).map(function(i){ return i.value.trim(); }).filter(Boolean);
      var status = document.getElementById('poll-status');
      if (!question) { status.textContent = 'Enter a question.'; return; }
      if (opts.length < 2) { status.textContent = 'Add at least 2 options.'; return; }
      status.textContent = 'Creating…';
      apiPost('polls', { question: question, options: opts }).then(function(d) {
        if (d.ok) {
          document.getElementById('poll-question').value = '';
          var list = document.getElementById('poll-opts-list');
          list.querySelectorAll('.poll-opt').forEach(function(i, idx){ i.value = ''; i.placeholder = 'Option ' + (idx+1) + '…'; });
          while (list.children.length > 2) list.removeChild(list.lastChild);
          status.textContent = '';
          loadPolls();
        } else { status.textContent = d.error || 'Error.'; }
      });
    }
  }

  /* ── Scores ── */
  function renderScores() {
    var panel = document.getElementById('env-panel-scores');
    if (!panel) return;
    apiGet('scores').then(function(scores) {
      var sorted = scores.slice().sort(function(a,b){ return b.score - a.score; });
      var rankClass = ['gold','silver','bronze'];

      var rows = sorted.map(function(entry, i) {
        var rc = i < 3 ? 'class="env-scores-rank ' + rankClass[i] + '"' : 'class="env-scores-rank"';
        var label = i < 3 ? ['🥇','🥈','🥉'][i] : (i+1);
        return '<div class="env-scores-row' + (i === 0 ? ' rank-1' : '') + '">' +
          '<div ' + rc + '>' + label + '</div>' +
          '<div class="env-scores-name">' + esc(entry.name) + '</div>' +
          '<div class="env-scores-val">' + entry.score + '</div>' +
        '</div>';
      }).join('');

      var editorRows = scores.map(function(entry) {
        return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">' +
          '<span style="flex:1;font-size:14px;color:rgba(255,255,255,0.7)">' + esc(entry.name) + '</span>' +
          '<input type="number" class="env-dark-input score-val" data-name="' + esc(entry.name) + '" value="' + entry.score + '" style="width:90px;text-align:center">' +
        '</div>';
      }).join('');

      panel.innerHTML =
        '<div class="rh-chart-wrap">' +
          '<div class="rh-chart-header">' +
            '<div class="rh-chart-title">Scores</div>' +
            '<button class="rh-refresh-btn" id="scores-refresh">Refresh</button>' +
          '</div>' +
          (sorted.length ? rows : '<p class="env-empty">No scores yet.</p>') +
          '<div class="env-add-section">' +
            '<div class="env-add-title">Update Scores</div>' +
            (editorRows || '<p style="color:rgba(255,255,255,0.3);font-size:13px">No members added to this environment.</p>') +
            (editorRows ? '<div style="display:flex;gap:10px;align-items:center;margin-top:4px"><button id="scores-save" class="env-dark-btn">Save Scores</button><span id="scores-status" class="env-status"></span></div>' : '') +
          '</div>' +
        '</div>';

      document.getElementById('scores-refresh').addEventListener('click', renderScores);
      var saveBtn = document.getElementById('scores-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          var newScores = [];
          panel.querySelectorAll('.score-val').forEach(function(inp) {
            newScores.push({ name: inp.dataset.name, score: parseInt(inp.value, 10) || 0 });
          });
          var status = document.getElementById('scores-status');
          if (status) status.textContent = 'Saving…';
          apiPut('scores', { scores: newScores }).then(function(d) {
            if (d.ok) {
              if (status) status.textContent = 'Saved!';
              setTimeout(renderScores, 800);
            } else { if (status) status.textContent = d.error || 'Error.'; }
          });
        });
      }
    });
  }

  /* ── Awards add-row fix (remove duplicate listener) ── */
  // initGate kicks everything off
  initGate();
})();
