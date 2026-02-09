// ChatGPT Search Redesign - Interactive Implementation

// Sample data for demonstration
const CALENDAR_CHEVRON_ICON = "https://www.figma.com/api/mcp/asset/64e053f0-bf8b-46ef-82bf-265c0db99b53";
const CALENDAR_ARROWS_ICON = "https://www.figma.com/api/mcp/asset/49a2f184-0be3-4302-8aaa-b49e923bf0aa";
let baseChats = [
  { id: 1, title: "Apple Device", date: "5 Jan", type: "chat", project: "My Fruits" },
  { id: 2, title: "Benefits of eating Apple", date: "12 Jan", type: "chat", project: "UX guidelines" },
  { id: 3, title: "Apple Pie Recipe", date: "28 Jan", type: "chat", project: "Daily Workouts" },
];

let hiddenChats = [
  { id: 201, title: "Apple Orchard Plan", date: "2 Feb", type: "chat", project: "Law" },
  { id: 202, title: "Mac Health Checklist", date: "7 Feb", type: "chat", project: "Apollo" },
  { id: 203, title: "Apple Storage Tips", date: "24 Jan", type: "chat", project: "My Fruits" },
  { id: 204, title: "Healthy Apple Smoothie", date: "31 Jan", type: "chat", project: "UX guidelines" },
];

const extraChats = [
  { id: 101, title: "Apple Orchard Plan", date: "2 Feb", type: "chat", project: "Law" },
  { id: 102, title: "Mac Health Checklist", date: "7 Feb", type: "chat", project: "Apollo" },
  { id: 103, title: "Apple Storage Tips", date: "24 Jan", type: "chat", project: "My Fruits" },
  { id: 104, title: "Healthy Apple Smoothie", date: "31 Jan", type: "chat", project: "UX guidelines" },
];

const sampleMessages = [
  { id: 1, title: "Best Fruits to eat", subtitle: "Apple", date: "19 Jan", type: "message", author: "user", thumb: "speaker.svg", contentType: "List", contentTypeIcon: "List.svg" },
  { id: 2, title: "Sentence formation", subtitle: "Yup give me an apple", date: "1 Feb", type: "message", author: "user", thumb: "speaker.svg" },
  { id: 3, title: "Building Fruit game", subtitle: "(Hello Apple)", date: "3 Feb", type: "message", author: "chatgpt", thumb: "chatgpt.svg", thumbClass: "square", contentType: "Code", contentTypeIcon: "code.svg" },
  { id: 4, title: "Fruits and their nutrients", subtitle: "Apple", date: "27 Jan", type: "message", author: "chatgpt", thumb: "chatgpt.svg", thumbClass: "square", contentType: "Table", contentTypeIcon: "Table.svg" },
];

// State management
let searchMode = "full"; // "titles" or "full"
let loadMoreRevealed = false;
let currentFilters = {
  contentType: [],
  projects: [],
  byWhom: null,
  date: null,
  attachments: null
};

// DOM Elements
const searchInput = document.querySelector('.search input');
const primaryPill = document.querySelector('.primary-pill-wrapper .pill');
const filterPills = document.querySelectorAll('.secondary-filters .pill');
const contentTypePill = Array.from(filterPills).find(pill => {
  const label = pill.querySelector('span:first-child');
  return label && label.textContent.trim() === 'Content Type';
});
const byWhomPill = Array.from(filterPills).find(pill => {
  const label = pill.querySelector('span:first-child');
  return label && label.textContent.trim() === 'By Whom';
});
const datePill = Array.from(filterPills).find(pill => {
  const label = pill.querySelector('span:first-child');
  return label && label.textContent.trim() === 'Date';
});
const attachmentsPill = Array.from(filterPills).find(pill => {
  const label = pill.querySelector('span:first-child');
  return label && label.textContent.trim() === 'Attachments';
});
let activeCalendarState = null;
let calendarMouseupBound = false;
const scrollArea = document.querySelector('.scroll-area');
const loadMoreBtn = document.querySelector('.load-more');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  updateFilterMode();
  const path = window.location.pathname.toLowerCase();
  const isChat = path.endsWith('/chat.html');
  if (isChat) {
    const navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry && navEntry.type === 'reload') {
      window.location.replace('index.html');
      return;
    }
    if (!window.location.search) {
      window.location.replace('index.html');
      return;
    }
  }
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q && searchInput) {
    searchInput.value = q;
  }
  handleSearch();
});

// Event Listeners
function setupEventListeners() {
  // Search input
  searchInput.addEventListener('input', debounce(handleSearch, 300));

  // Primary filter toggle
  primaryPill.addEventListener('click', toggleSearchMode);

  // Secondary filters
  filterPills.forEach(pill => {
    if (pill === contentTypePill) {
      pill.setAttribute('role', 'button');
      pill.setAttribute('tabindex', '0');
      pill.addEventListener('click', (e) => handleContentTypeClick(e, pill));
      pill.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleContentTypeClick(e, pill);
        }
      });
    } else if (pill === byWhomPill) {
      pill.setAttribute('role', 'button');
      pill.setAttribute('tabindex', '0');
      pill.addEventListener('click', (e) => handleByWhomClick(e, pill));
      pill.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleByWhomClick(e, pill);
        }
      });
    } else if (pill === datePill) {
      pill.setAttribute('role', 'button');
      pill.setAttribute('tabindex', '0');
      pill.addEventListener('click', (e) => handleDateClick(e, pill));
      pill.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleDateClick(e, pill);
        }
      });
    } else if (pill === attachmentsPill) {
      pill.setAttribute('role', 'button');
      pill.setAttribute('tabindex', '0');
      pill.addEventListener('click', (e) => handleAttachmentsClick(e, pill));
      pill.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleAttachmentsClick(e, pill);
        }
      });
    } else {
      pill.addEventListener('click', (e) => handleFilterClick(e, pill));
    }
  });

  // Load more button
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', handleLoadMore);
  }
}

// Toggle between "Search Only Chat Titles" and full search
function toggleSearchMode() {
  searchMode = searchMode === "titles" ? "full" : "titles";

  if (searchMode === "titles") {
    primaryPill.classList.add('active');
  } else {
    primaryPill.classList.remove('active');
  }

  // Add subtle animation
  primaryPill.style.transform = 'scale(0.95)';
  setTimeout(() => {
    primaryPill.style.transform = 'scale(1)';
  }, 100);

  updateFilterMode();
  handleSearch();
}

function updateFilterMode() {
  const isTitles = searchMode === 'titles';
  if (byWhomPill) byWhomPill.style.display = isTitles ? 'none' : '';
  if (attachmentsPill) attachmentsPill.style.display = isTitles ? 'none' : '';

  if (isTitles) {
    currentFilters.contentType = [];
    currentFilters.byWhom = null;
    currentFilters.attachments = null;
    if (byWhomPill) {
      byWhomPill.classList.remove('is-applied', 'is-open');
      byWhomPill.innerHTML = `<span>By Whom</span><span class="chevron"></span>`;
    }
    if (attachmentsPill) {
      attachmentsPill.classList.remove('is-applied', 'is-open');
      attachmentsPill.innerHTML = `<span>Attachments</span><span class="chevron"></span>`;
    }
  } else {
    currentFilters.projects = [];
  }

  if (contentTypePill) {
    updateContentTypePill(contentTypePill);
  }
}

// Handle search input
function handleSearch() {
  const query = searchInput.value.toLowerCase().trim();
  
  const messageOnlyFilters =
    searchMode !== "titles" &&
    ((currentFilters.contentType && currentFilters.contentType.length > 0) ||
    !!currentFilters.byWhom ||
    !!currentFilters.attachments);
  const hasAnyFilter = messageOnlyFilters || !!currentFilters.date || (currentFilters.projects && currentFilters.projects.length > 0);
  if (!query && !hasAnyFilter && searchMode === "full" && !loadMoreRevealed) {
    loadMoreRevealed = false;
  }
  const filterChatsByQuery = (list) => {
    if (!query) return list;
    return list.filter(chat => chat.title.toLowerCase().includes(query));
  };

  const baseFiltered = filterChatsByQuery(baseChats);
  const hiddenFiltered = filterChatsByQuery(hiddenChats);
  const extraFiltered = filterChatsByQuery(extraChats);

  const baseQueryChatsAll = baseFiltered.concat(hiddenFiltered, extraFiltered);

  let filteredChats = [];
  let hiddenCount = 0;

  if (searchMode === "titles") {
    filteredChats = baseFiltered.concat(extraFiltered);
    hiddenCount = 0;
  } else if (loadMoreRevealed) {
    filteredChats = baseFiltered.concat(hiddenFiltered);
    hiddenCount = 0;
  } else {
    filteredChats = baseFiltered;
    hiddenCount = hiddenFiltered.length;
  }

  let filteredMessages = sampleMessages;
  
  if (query) {
    if (searchMode === "titles") {
      // Search only in titles
      filteredMessages = sampleMessages.filter(msg =>
        msg.title.toLowerCase().includes(query)
      );
    } else {
      // Search in titles and subtitles
      filteredMessages = sampleMessages.filter(msg =>
        msg.title.toLowerCase().includes(query) ||
        msg.subtitle.toLowerCase().includes(query)
      );
    }
  }
  const baseQueryMessagesAll = filteredMessages.slice();

  // Apply Content Type filter (messages only, chats hidden)
  if (currentFilters.contentType && currentFilters.contentType.length > 0 && searchMode !== "titles") {
    filteredChats = [];
    hiddenCount = 0;
    filteredMessages = filteredMessages.filter(msg =>
      msg.contentType && currentFilters.contentType.some(t => t.toLowerCase() === msg.contentType.toLowerCase())
    );
  }

  if (currentFilters.projects && currentFilters.projects.length > 0 && searchMode === "titles") {
    filteredChats = filteredChats.filter(chat =>
      chat.project && currentFilters.projects.some(p => p.toLowerCase() === chat.project.toLowerCase())
    );
  }

  if (currentFilters.byWhom) {
    filteredChats = [];
    hiddenCount = 0;
    filteredMessages = filteredMessages.filter(msg => msg.author === currentFilters.byWhom);
  }

  if (currentFilters.attachments && searchMode !== "titles") {
    filteredChats = [];
    hiddenCount = 0;
    filteredMessages = filteredMessages.filter(msg =>
      msg.attachmentType && msg.attachmentType.toLowerCase() === currentFilters.attachments.toLowerCase()
    );
  }

  if (currentFilters.date && currentFilters.date.start) {
    const start = startOfDay(currentFilters.date.start);
    const end = currentFilters.date.end ? startOfDay(currentFilters.date.end) : null;
    hiddenCount = 0;
    filteredChats = filteredChats.filter(chat => {
      const chatDate = parseDateLabel(chat.date);
      if (!chatDate) return false;
      if (end) {
        return chatDate >= start && chatDate <= end;
      }
      return isSameDay(chatDate, start);
    });
    filteredMessages = filteredMessages.filter(msg => {
      const msgDate = parseDateLabel(msg.date);
      if (!msgDate) return false;
      if (end) {
        return msgDate >= start && msgDate <= end;
      }
      return isSameDay(msgDate, start);
    });
  }
  
  renderResults(filteredChats, filteredMessages, query, messageOnlyFilters, hiddenCount, hasAnyFilter, baseQueryChatsAll, baseQueryMessagesAll);
}

// Render search results
function renderResults(chats = baseChats, messages = sampleMessages, query = '', hasAnyFilter = false, hiddenCount = 0, hasFilters = false, baseQueryChatsAll = [], baseQueryMessagesAll = []) {
  // Clear current results (keep section titles)
  const existingItems = scrollArea.querySelectorAll('.item');
  existingItems.forEach(item => item.remove());
  const existingEmpty = scrollArea.querySelector('.filter-empty-state');
  if (existingEmpty) existingEmpty.remove();
  const existingNoResults = scrollArea.querySelector('.no-results');
  if (existingNoResults) existingNoResults.remove();
  
  const existingChatsHeadings = Array.from(scrollArea.querySelectorAll('.section-title'))
    .filter(el => el.textContent.trim() === 'Chats');
  if (existingChatsHeadings.length > 1) {
    existingChatsHeadings.slice(1).forEach(el => el.remove());
  }
  let chatSection = scrollArea.querySelector('.section-title[data-section="chats"]') || existingChatsHeadings[0];
  const loadMore = scrollArea.querySelector('.load-more');
  const showChats = !hasAnyFilter && chats.length > 0;
  
  if (!showChats && chatSection) {
    chatSection.remove();
    chatSection = null;
  }

  if (showChats && !chatSection) {
    chatSection = document.createElement('div');
    chatSection.className = 'section-title';
    chatSection.dataset.section = 'chats';
    scrollArea.insertAdjacentElement('afterbegin', chatSection);
  }
  if (showChats && chatSection) {
    renderChatHeader(chatSection, loadMoreRevealed);
  }
  
  // Render chats
  let lastChatEl = null;
  if (showChats && chatSection) {
    let insertAfter = chatSection;
    chats.forEach(chat => {
      const chatEl = createChatElement(chat, query);
      insertAfter.insertAdjacentElement('afterend', chatEl);
      insertAfter = chatEl;
      lastChatEl = chatEl;
    });
  }
  if (showChats && loadMoreRevealed) {
    const chatItems = scrollArea.querySelectorAll('.item');
    chatItems.forEach(item => {
      item.style.marginLeft = '0';
      item.style.marginRight = '0';
    });
  }
  
  // Ensure Load More sits after the chat list (and before Messages when visible)
  if (loadMore) {
    if (showChats && chatSection) {
      if (lastChatEl) {
        lastChatEl.insertAdjacentElement('afterend', loadMore);
      } else {
        chatSection.insertAdjacentElement('afterend', loadMore);
      }
    }
  }

  // Only show message results when not in "titles only" mode
  const showMessages = searchMode !== "titles" && messages.length > 0;
  const existingMessagesSection = Array.from(scrollArea.querySelectorAll('.section-title'))
    .find(el => el.textContent === 'Messages');

  // Remove any leftover Messages heading when Messages are hidden
  if (!showMessages && existingMessagesSection) {
    existingMessagesSection.remove();
  }

  if (showMessages) {
    // Find or create Messages section
    let messagesSection = existingMessagesSection;
    if (!messagesSection) {
      messagesSection = document.createElement('div');
      messagesSection.className = 'section-title';
      messagesSection.textContent = 'Messages';
      if (showChats && loadMore) {
        loadMore.insertAdjacentElement('afterend', messagesSection);
      } else {
        scrollArea.appendChild(messagesSection);
      }
    }
    if (showChats && loadMore && messagesSection.previousElementSibling !== loadMore) {
      loadMore.insertAdjacentElement('afterend', messagesSection);
    }

    // Render messages
    messages.forEach(msg => {
      const msgEl = createMessageElement(msg, query);
      messagesSection.insertAdjacentElement('afterend', msgEl);
    });
  } else if (existingMessagesSection) {
    existingMessagesSection.remove();
  }
  
  // Update load more text
  if (loadMore) {
    const remainingCount = loadMoreRevealed ? 0 : hiddenCount;
    loadMore.textContent = `Load More Chats(+${remainingCount})`;
    loadMore.style.display = (searchMode === "titles" || loadMoreRevealed || remainingCount === 0 || !showChats) ? 'none' : 'block';
  }
  
  const noChats = chats.length === 0;
  const noMessages = messages.length === 0 || searchMode === "titles";
  const baseHadResults = (baseQueryChatsAll && baseQueryChatsAll.length > 0) || (baseQueryMessagesAll && baseQueryMessagesAll.length > 0);
  const anyFilterActive = !!hasFilters;

  if (noChats && (noMessages || searchMode === "titles")) {
    if (anyFilterActive && baseHadResults) {
      showFiltersEmptyState();
      return;
    }
    if (query) {
      showNoResults();
    }
  }
}

function renderChatHeader(chatSection, expanded) {
  chatSection.innerHTML = '';
  const label = document.createElement('span');
  label.textContent = 'Chats';
  chatSection.appendChild(label);

  if (expanded) {
    chatSection.style.cursor = 'pointer';
    chatSection.onclick = () => {
      loadMoreRevealed = false;
      handleSearch();
    };
  } else {
    chatSection.style.cursor = 'default';
    chatSection.onclick = null;
  }
}

function showFiltersEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'filter-empty-state';
  empty.innerHTML = `
    <div class="filter-empty-text">
      <div class="filter-empty-title">No Results Found !</div>
      <div class="filter-empty-subtitle">Some filters might be blocking relevant results</div>
    </div>
    <button class="filter-empty-btn" type="button">Search Without Filters</button>
  `;
  const button = empty.querySelector('.filter-empty-btn');
  button.addEventListener('click', () => {
    resetAllFilters();
    handleSearch();
  });
  scrollArea.appendChild(empty);
}

function resetAllFilters() {
  currentFilters.contentType = [];
  currentFilters.projects = [];
  currentFilters.byWhom = null;
  currentFilters.date = null;
  currentFilters.attachments = null;

  if (contentTypePill) {
    contentTypePill.classList.remove('is-open', 'is-applied');
    contentTypePill.innerHTML = `<span>${searchMode === 'titles' ? 'Projects' : 'Content Type'}</span><span class="chevron"></span>`;
  }
  if (byWhomPill) {
    byWhomPill.classList.remove('is-open', 'is-applied');
    byWhomPill.innerHTML = `<span>By Whom</span><span class="chevron"></span>`;
  }
  if (datePill) {
    datePill.classList.remove('is-open', 'is-applied');
    datePill.innerHTML = `<span>Date</span><span class="chevron"></span>`;
  }
  if (attachmentsPill) {
    attachmentsPill.classList.remove('is-open', 'is-applied');
    attachmentsPill.innerHTML = `<span>Attachments</span><span class="chevron"></span>`;
  }
  document.querySelectorAll('.filter-dropdown').forEach(d => d.remove());
}

// Create chat item element
function createChatElement(chat, query = '') {
  const item = document.createElement('div');
  item.className = 'item';
  item.style.opacity = '0';
  item.style.transform = 'translateY(10px)';

  const title = highlightText(chat.title, query);

  item.innerHTML = `
    <div class="item-left">
      <img class="chat-icon" src="Chat.svg" alt="Chat" />
      <div class="title">${title}</div>
    </div>
    <div class="date">${chat.date}</div>
  `;

  // Animate in
  setTimeout(() => {
    item.style.transition = 'all 0.3s ease';
    item.style.opacity = '1';
    item.style.transform = 'translateY(0)';
  }, 10);

  return item;
}

// Create message item element
function createMessageElement(msg, query = '') {
  const item = document.createElement('div');
  item.className = 'item';
  item.style.opacity = '0';
  item.style.transform = 'translateY(10px)';

  const title = highlightText(msg.title, query);
  const subtitleText = highlightText(msg.subtitle, query);
  const subtitle = msg.contentTypeIcon
    ? `<span class="content-type-inline"><img class="content-type-icon" src="${msg.contentTypeIcon}" alt="${msg.contentType || 'Content'} icon" />${subtitleText}</span>`
    : subtitleText;
  const thumbClass = msg.thumbClass ? `thumb ${msg.thumbClass}` : 'thumb';

  item.innerHTML = `
    <div class="item-left">
      <img class="${thumbClass}" src="${msg.thumb}" alt="${msg.author}" />
      <div>
        <div class="title">${title}</div>
        <div class="subtitle">${subtitle}</div>
      </div>
    </div>
    <div class="date">${msg.date}</div>
  `;

  // Animate in
  setTimeout(() => {
    item.style.transition = 'all 0.3s ease';
    item.style.opacity = '1';
    item.style.transform = 'translateY(0)';
  }, 10);

  return item;
}

// Highlight search query in text
function highlightText(text, query) {
  if (!query) return text;

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<span class="match-highlight">$1</span>');
}

// Escape regex special characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Handle filter pill clicks
function handleFilterClick(e, pill) {
  const filterName = pill.querySelector('span:first-child').textContent;

  // Toggle active state
  pill.classList.toggle('active');

  // Add ripple effect
  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(90, 90, 247, 0.1);
    border-radius: 100px;
    pointer-events: none;
    animation: ripple 0.6s ease-out;
  `;

  // Create dropdown menu (placeholder for now)
  showFilterDropdown(pill, filterName);
}

// Content Type filter handling
function handleContentTypeClick(e, pill) {
  e.stopPropagation();
  if (e.target && (e.target.classList.contains('clear-btn') || e.target.closest('.clear-btn'))) {
    clearContentType(pill);
    document.querySelectorAll('.filter-dropdown').forEach(d => d.remove());
    return;
  }

  const isOpen = pill.classList.contains('is-open');
  document.querySelectorAll('.pill.is-open').forEach(p => p.classList.remove('is-open'));
  document.querySelectorAll('.filter-dropdown').forEach(d => d.remove());

  if (isOpen) return;

  pill.classList.add('is-open');
  showContentTypeDropdown(pill);
}

function applyContentType(pill, value) {
  const list = searchMode === 'titles' ? currentFilters.projects : currentFilters.contentType;
  if (!list.includes(value)) {
    list.push(value);
  }
  updateContentTypePill(pill);
  handleSearch();
  if (pill.classList.contains('is-open')) {
    showContentTypeDropdown(pill);
  }
}

function clearContentType(pill) {
  if (searchMode === 'titles') {
    currentFilters.projects = [];
  } else {
    currentFilters.contentType = [];
  }
  pill.classList.remove('is-open', 'is-applied');
  pill.innerHTML = `<span>${searchMode === 'titles' ? 'Projects' : 'Content Type'}</span><span class="chevron"></span>`;
  handleSearch();
}

function updateContentTypePill(pill) {
  const selected = searchMode === 'titles' ? currentFilters.projects : currentFilters.contentType;
  if (!selected || selected.length === 0) {
    pill.classList.remove('is-applied');
    pill.innerHTML = `<span>${searchMode === 'titles' ? 'Projects' : 'Content Type'}</span><span class="chevron"></span>`;
    return;
  }
  pill.classList.add('is-applied');
  const label = selected.length === 1 ? selected[0] : `${selected[0]} +${selected.length - 1}`;
  if (searchMode === 'titles') {
  pill.innerHTML = `<span>${label}</span><span class="clear-btn" aria-label="Clear filter" role="button"><img class="clear-icon" src="Cross.svg" alt="" /></span>`;
    return;
  }
  const iconMap = {
    Code: 'code.svg',
    List: 'List.svg',
    Canvas: 'Canvas.svg',
    Table: 'Table.svg'
  };
  const iconSrc = iconMap[selected[0]];
  const iconHtml = iconSrc ? `<img class="pill-icon" src="${iconSrc}" alt="" />` : '';
  pill.innerHTML = `${iconHtml}<span>${label}</span><span class="clear-btn" aria-label="Clear filter" role="button"><img class="clear-icon" src="Cross.svg" alt="" /></span>`;
}

function removeContentType(pill, value) {
  if (searchMode === 'titles') {
    currentFilters.projects = currentFilters.projects.filter(v => v !== value);
  } else {
    currentFilters.contentType = currentFilters.contentType.filter(v => v !== value);
  }
  updateContentTypePill(pill);
  handleSearch();
}

function showContentTypeDropdown(pill) {
  const isProjects = searchMode === 'titles';
  const options = isProjects
    ? ['My Fruits', 'UX guidelines', 'Daily Workouts', 'Law', 'Apollo', 'Marketing Hub', 'Client Alpha', 'Design System', 'Meeting Notes', 'Roadmap 2026']
    : ['Code', 'List', 'Canvas', 'Table'];

  showFilterDropdown(pill, 'Content Type', isProjects ? [] : options, (value) => {
    applyContentType(pill, value);
  }, (dropdown) => {
    const inputWrap = document.createElement('div');
    inputWrap.className = 'content-type-input';

    const chips = document.createElement('div');
    chips.className = 'content-type-chips';
    const selected = searchMode === 'titles' ? currentFilters.projects : currentFilters.contentType;
    selected.forEach(val => {
      const chip = document.createElement('span');
      chip.className = 'content-type-chip';
      chip.innerHTML = `<span>${val}</span><span class="chip-clear" role="button" aria-label="Remove ${val}"><img class="clear-icon" src="Cross.svg" alt="" /></span>`;
      chip.querySelector('.chip-clear').addEventListener('click', (e) => {
        e.stopPropagation();
        removeContentType(pill, val);
        showContentTypeDropdown(pill);
      });
      chips.appendChild(chip);
    });
    inputWrap.classList.toggle('has-chips', selected.length > 0);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = searchMode === 'titles' ? 'Select your project' : 'Select Content Type';
    input.className = 'content-type-input-field';

    inputWrap.appendChild(chips);
    inputWrap.appendChild(input);
    dropdown.prepend(inputWrap);
    input.addEventListener('click', (e) => e.stopPropagation());
    inputWrap.addEventListener('click', (e) => {
      e.stopPropagation();
      input.focus();
    });

    if (isProjects) {
      const list = document.createElement('div');
      list.className = 'project-list';
      dropdown.appendChild(list);

      const renderList = (query = '') => {
        list.innerHTML = '';
        const q = query.toLowerCase().trim();
        const ordered = options
          .map((name, index) => ({
            name,
            index,
            match: q ? name.toLowerCase().includes(q) : true
          }))
          .sort((a, b) => {
            if (a.match === b.match) return a.index - b.index;
            return a.match ? -1 : 1;
          });

        ordered.forEach(({ name, match }) => {
          if (q && !match) return;
          const row = document.createElement('div');
          row.className = 'project-option';
          row.innerHTML = `<img src="Project.svg" alt="" /><span>${name}</span>`;
          row.addEventListener('click', (e) => {
            e.stopPropagation();
            applyContentType(pill, name);
          });
          list.appendChild(row);
        });
      };

      renderList();
      input.addEventListener('input', () => renderList(input.value));
    }
  });
}

function handleDateClick(e, pill) {
  e.stopPropagation();
  if (e.target && (e.target.classList.contains('clear-btn') || e.target.closest('.clear-btn'))) {
    currentFilters.date = null;
    pill.classList.remove('is-applied', 'is-open');
    pill.innerHTML = `<span>Date</span><span class="chevron"></span>`;
    document.querySelectorAll('.filter-dropdown').forEach(d => d.remove());
    return;
  }

  const isOpen = pill.classList.contains('is-open');
  document.querySelectorAll('.pill.is-open').forEach(p => p.classList.remove('is-open'));
  document.querySelectorAll('.filter-dropdown').forEach(d => d.remove());

  if (isOpen) return;

  pill.classList.add('is-open');
  showFilterDropdown(pill, 'Date');
}

// By Whom filter handling
function handleByWhomClick(e, pill) {
  e.stopPropagation();
  if (e.target && (e.target.classList.contains('clear-btn') || e.target.closest('.clear-btn'))) {
    clearByWhom(pill);
    return;
  }

  const isOpen = pill.classList.contains('is-open');
  document.querySelectorAll('.pill.is-open').forEach(p => p.classList.remove('is-open'));
  document.querySelectorAll('.filter-dropdown').forEach(d => d.remove());

  if (isOpen) return;

  pill.classList.add('is-open');
  showFilterDropdown(
    pill,
    'By Whom',
    [
      { image: 'Speaker.svg', label: 'User', value: 'user' },
      { image: 'Chatgpt.svg', label: 'ChatGPT', value: 'chatgpt' }
    ],
    (_label, option) => {
      applyByWhom(pill, option);
    }
  );
}

// Attachments filter handling
function handleAttachmentsClick(e, pill) {
  e.stopPropagation();
  if (e.target && (e.target.classList.contains('clear-btn') || e.target.closest('.clear-btn'))) {
    currentFilters.attachments = null;
    pill.classList.remove('is-applied', 'is-open');
    pill.innerHTML = `<span>Attachments</span><span class="chevron"></span>`;
    document.querySelectorAll('.filter-dropdown').forEach(d => d.remove());
    handleSearch();
    return;
  }

  const isOpen = pill.classList.contains('is-open');
  document.querySelectorAll('.pill.is-open').forEach(p => p.classList.remove('is-open'));
  document.querySelectorAll('.filter-dropdown').forEach(d => d.remove());

  if (isOpen) return;

  pill.classList.add('is-open');
  showFilterDropdown(pill, 'Attachments', getFilterOptions('Attachments'), (label) => {
    currentFilters.attachments = label;
    const iconMap = {
      Image: 'Image.svg',
      Document: 'Document.svg'
    };
    const iconSrc = iconMap[label];
    const iconHtml = iconSrc ? `<img class="pill-icon" src="${iconSrc}" alt="" />` : '';
    pill.classList.add('is-applied');
    pill.classList.remove('is-open');
    pill.innerHTML = `${iconHtml}<span>${label}</span><span class="clear-btn" aria-label="Clear filter" role="button"><img class="clear-icon" src="Cross.svg" alt="" /></span>`;
    handleSearch();
  });
}

function applyByWhom(pill, option) {
  if (!option || !option.value) return;
  currentFilters.byWhom = option.value;
  pill.classList.remove('is-open');
  pill.classList.add('is-applied');
  const iconHtml = option.image ? `<img class="pill-icon no-tint" src="${option.image}" alt="" />` : '';
  pill.innerHTML = `${iconHtml}<span>${option.label}</span><span class="clear-btn" aria-label="Clear filter" role="button"><img class="clear-icon" src="Cross.svg" alt="" /></span>`;
  handleSearch();
}

function clearByWhom(pill) {
  currentFilters.byWhom = null;
  pill.classList.remove('is-open', 'is-applied');
  pill.innerHTML = `<span>By Whom</span><span class="chevron"></span>`;
  handleSearch();
}

// Show filter dropdown (placeholder)
function showFilterDropdown(pill, filterName, overrideOptions, onSelect, onRender) {
  // Remove existing dropdowns
  document.querySelectorAll('.filter-dropdown').forEach(d => d.remove());

  const dropdown = document.createElement('div');
  dropdown.className = 'filter-dropdown';
  const rect = pill.getBoundingClientRect();
  const isCalendar = filterName === 'Date';
  const baseWidth = isCalendar ? 371 : 278;
  const viewportPad = 16;
  const maxWidth = Math.max(280, window.innerWidth - viewportPad * 2);
  const width = Math.min(baseWidth, maxWidth);
  const left = Math.min(rect.left, window.innerWidth - width - viewportPad);
  const top = Math.round(rect.bottom + 8);
  const paddingRule = isCalendar ? '' : 'padding: 8px;';
  dropdown.style.cssText = `
    position: fixed;
    top: ${top}px;
    left: ${Math.max(viewportPad, Math.round(left))}px;
    background: white;
    border: 1px solid var(--border);
    border-radius: 12px;
    ${paddingRule}
    box-shadow: var(--shadow);
    width: ${width}px;
    min-width: ${width}px;
    z-index: 1000;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.2s ease;
  `;

  if (typeof onRender === 'function') {
    onRender(dropdown);
  }

  // Handle different filter types
  if (filterName === 'Date') {
    dropdown.classList.add('calendar-dropdown');
    createCalendarDropdown(dropdown);
  } else {
    // Sample options based on filter type
    const options = overrideOptions || getFilterOptions(filterName);

    options.forEach(option => {
      const optionEl = document.createElement('div');
      optionEl.style.cssText = `
        padding: 10px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s ease;
        display: flex;
        align-items: center;
        gap: 10px;
      `;

      // Add icon/image based on filter type
      if (filterName === 'Content Type') {
        const labelText = typeof option === 'string' ? option : option.label;
        const iconMap = {
          Code: 'code.svg',
          List: 'List.svg',
          Canvas: 'Canvas.svg',
          Table: 'Table.svg'
        };
        const iconSrc = iconMap[labelText];
        if (iconSrc) {
          const img = document.createElement('img');
          img.src = iconSrc;
          img.style.cssText = 'width: 20px; height: 20px;';
          optionEl.appendChild(img);
        }
        const label = document.createElement('span');
        label.textContent = labelText;
        optionEl.appendChild(label);
      } else if (filterName === 'By Whom') {
        if (option.image) {
          const img = document.createElement('img');
          img.src = option.image;
          img.style.cssText = 'width: 20px; height: 20px; border-radius: 4px;';
          optionEl.appendChild(img);
        } else {
          const icon = document.createElement('span');
          icon.className = 'material-symbols-rounded';
          icon.style.fontSize = '20px';
          icon.style.color = 'var(--muted)';
          icon.textContent = option.icon;
          optionEl.appendChild(icon);
        }

        const label = document.createElement('span');
        label.textContent = option.label;
        optionEl.appendChild(label);
      } else if (filterName === 'Attachments') {
        if (option.image) {
          const img = document.createElement('img');
          img.src = option.image;
          img.style.cssText = 'width: 20px; height: 20px; border-radius: 4px;';
          optionEl.appendChild(img);
        }
        const label = document.createElement('span');
        label.textContent = option.label || option;
        optionEl.appendChild(label);
      } else {
        optionEl.textContent = option;
      }

      optionEl.addEventListener('mouseenter', () => {
        optionEl.style.background = '#f9fafb';
      });
      optionEl.addEventListener('mouseleave', () => {
        optionEl.style.background = 'transparent';
      });
      optionEl.addEventListener('click', (evt) => {
        evt.stopPropagation();
        const selectedLabel = option.label || option;
        if (typeof onSelect === 'function') {
          onSelect(selectedLabel, option);
          if (filterName !== 'Content Type') {
            dropdown.remove();
          }
        } else {
          console.log(`Selected: ${filterName} - ${selectedLabel}`);
          dropdown.remove();
        }
      });
      dropdown.appendChild(optionEl);
    });
  }

  document.body.appendChild(dropdown);

  // Animate in
  setTimeout(() => {
    dropdown.style.opacity = '1';
    dropdown.style.transform = 'translateY(0)';
  }, 10);

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function closeDropdown(e) {
      if (!pill.contains(e.target) && !dropdown.contains(e.target)) {
        pill.classList.remove('is-open');
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(-10px)';
        setTimeout(() => dropdown.remove(), 200);
        document.removeEventListener('click', closeDropdown);
      }
    });
  }, 100);
}

// Get filter options based on filter name
function getFilterOptions(filterName) {
  const optionsMap = {
    'Content Type': [
      { icon: 'code', label: 'Code' },
      { icon: 'list', label: 'List' },
      { icon: 'image', label: 'Image' },
      { icon: 'description', label: 'Document' },
      { icon: 'table_chart', label: 'Table' }
    ],
    'By Whom': [
      { image: 'Speaker.svg', label: 'User', value: 'user' },
      { image: 'Chatgpt.svg', label: 'ChatGPT', value: 'chatgpt' }
    ],
    'Attachments': [
      { image: 'Image.svg', label: 'Image' },
      { image: 'Document.svg', label: 'Document' }
    ]
  };

  return optionsMap[filterName] || ['Option 1', 'Option 2', 'Option 3'];
}

// Create calendar dropdown
function createCalendarDropdown(dropdown) {
  const today = startOfDay(new Date());
  const preset = currentFilters.date;
  const initialStart = preset?.start ? startOfDay(new Date(preset.start)) : null;
  const initialEnd = preset?.end ? startOfDay(new Date(preset.end)) : null;
  const viewAnchor = initialEnd || initialStart || today;
  const state = {
    today,
    viewYear: viewAnchor.getFullYear(),
    viewMonth: viewAnchor.getMonth(),
    selectedDate: initialStart && !initialEnd ? initialStart : null,
    rangeStart: initialStart,
    rangeEnd: initialEnd,
    hoverDate: null,
    isDragging: false,
    _boundMouseup: false
  };
  activeCalendarState = state;

  dropdown.innerHTML = `
    <div class="calendar-header">
      <div class="calendar-month">
        <span class="calendar-month-text"></span>
        <img class="calendar-chevron" src="${CALENDAR_CHEVRON_ICON}" alt="" />
      </div>
      <div class="calendar-arrows">
        <img src="${CALENDAR_ARROWS_ICON}" alt="" />
        <button class="calendar-nav prev" aria-label="Previous month"></button>
        <button class="calendar-nav next" aria-label="Next month"></button>
      </div>
    </div>
    <div class="calendar-quick">
      <div class="calendar-quick-item" data-range="7">Last 7 days</div>
      <div class="calendar-quick-item" data-range="30">Last 30 days</div>
    </div>
    <div class="calendar-weekdays">
      <div class="calendar-weekday">SUN</div>
      <div class="calendar-weekday">MON</div>
      <div class="calendar-weekday">TUE</div>
      <div class="calendar-weekday">WED</div>
      <div class="calendar-weekday">THU</div>
      <div class="calendar-weekday">FRI</div>
      <div class="calendar-weekday">SAT</div>
    </div>
    <div class="calendar-grid"></div>
  `;

  const monthText = dropdown.querySelector('.calendar-month-text');
  const gridEl = dropdown.querySelector('.calendar-grid');

  const render = () => {
    monthText.textContent = new Date(state.viewYear, state.viewMonth).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
    gridEl.innerHTML = renderCalendarCells(state);
    attachCellHandlers(gridEl, state, render);
    requestAnimationFrame(() => renderRowHighlights(gridEl, state));
  };

  dropdown.querySelector('.calendar-nav.prev').addEventListener('click', (e) => {
    e.stopPropagation();
    const date = new Date(state.viewYear, state.viewMonth - 1, 1);
    state.viewYear = date.getFullYear();
    state.viewMonth = date.getMonth();
    render();
  });

  dropdown.querySelector('.calendar-nav.next').addEventListener('click', (e) => {
    e.stopPropagation();
    const date = new Date(state.viewYear, state.viewMonth + 1, 1);
    state.viewYear = date.getFullYear();
    state.viewMonth = date.getMonth();
    render();
  });

  dropdown.querySelectorAll('.calendar-quick-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const days = Number(item.dataset.range || 0);
      if (!days) return;
      const end = startOfDay(new Date());
      const start = addDays(end, -(days - 1));
      state.rangeStart = start;
      state.rangeEnd = end;
      state.selectedDate = null;
      state.hoverDate = null;
      state.viewYear = end.getFullYear();
      state.viewMonth = end.getMonth();
      applyDateFilter(start, end, false);
      render();
    });
  });

  if (!calendarMouseupBound) {
    document.addEventListener('mouseup', () => {
      const s = activeCalendarState;
      if (!s || !s.isDragging) return;
      s.isDragging = false;
      if (!s.rangeStart) return;

      const end = s.hoverDate && !isSameDay(s.hoverDate, s.rangeStart)
        ? s.hoverDate
        : null;

      s.rangeEnd = end;
      s.selectedDate = end ? null : s.rangeStart;
      s.hoverDate = null;
      applyDateFilter(s.rangeStart, s.rangeEnd, true);
      render();
    });
    calendarMouseupBound = true;
  }

  render();
}

function renderCalendarCells(state) {
  const firstDay = new Date(state.viewYear, state.viewMonth, 1).getDay();
  const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells = [];

  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDay + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push('<div class="calendar-cell calendar-cell--empty"></div>');
      continue;
    }

    const cellDate = startOfDay(new Date(state.viewYear, state.viewMonth, dayNum));
    const classes = ['calendar-cell'];

    const isDisabled = cellDate > state.today;
    if (isDisabled) classes.push('calendar-cell--disabled');

    const hasRange = state.rangeStart && state.rangeEnd;
    const hasHover = state.rangeStart && !state.rangeEnd && state.hoverDate;

    const rangeStart = state.rangeStart ? startOfDay(state.rangeStart) : null;
    const rangeEnd = state.rangeEnd ? startOfDay(state.rangeEnd) : null;

    if (hasRange) {
      const start = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
      const end = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
      if (cellDate > start && cellDate < end) classes.push('calendar-cell--range');
      if (isSameDay(cellDate, start)) classes.push('calendar-cell--fill');
      if (isSameDay(cellDate, end)) classes.push('calendar-cell--outline');
    } else if (state.selectedDate && isSameDay(cellDate, state.selectedDate)) {
      classes.push('calendar-cell--fill');
    } else if (rangeStart && isSameDay(cellDate, rangeStart)) {
      classes.push('calendar-cell--fill');
    }

    if (hasHover) {
      const hover = startOfDay(state.hoverDate);
      const start = rangeStart <= hover ? rangeStart : hover;
      const end = rangeStart <= hover ? hover : rangeStart;
      if (cellDate > start && cellDate < end) classes.push('calendar-cell--preview');
    }

    if (isSameDay(cellDate, state.today) && !classes.includes('calendar-cell--outline')) {
      classes.push('calendar-cell--today');
    }

    const dateStr = `${state.viewYear}-${state.viewMonth}-${dayNum}`;
    cells.push(`<div class="${classes.join(' ')}" data-date="${dateStr}">${dayNum}</div>`);
  }

  return cells.join('');
}

function attachCellHandlers(gridEl, state, render) {
  gridEl.querySelectorAll('.calendar-cell').forEach(cell => {
    if (cell.classList.contains('calendar-cell--empty')) return;
    if (cell.classList.contains('calendar-cell--disabled')) return;

    const dateStr = cell.getAttribute('data-date');
    if (!dateStr) return;
    const [y, m, d] = dateStr.split('-').map(Number);
    const cellDate = startOfDay(new Date(y, m, d));

    cell.addEventListener('mouseenter', () => {
      if (state.isDragging && state.rangeStart && !state.rangeEnd) {
        if (cellDate > state.today) return;
        state.hoverDate = cellDate;
        render();
      }
    });

    cell.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      if (cellDate > state.today) return;

      state.rangeStart = cellDate;
      state.rangeEnd = null;
      state.selectedDate = cellDate;
      state.hoverDate = cellDate;
      state.isDragging = true;
      render();
    });
  });
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return startOfDay(d);
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function parseDateLabel(label) {
  if (!label) return null;
  const trimmed = label.trim();
  const match = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3})(?:'?\s?(\d{2,4}))?$/);
  if (!match) return null;

  const day = Number(match[1]);
  const monStr = match[2].toLowerCase();
  const yearStr = match[3];
  const months = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  const month = months[monStr];
  if (month === undefined) return null;

  let year = 2026;
  if (yearStr) {
    const y = Number(yearStr);
    year = y < 100 ? 2000 + y : y;
  }

  return startOfDay(new Date(year, month, day));
}

function formatShortDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function applyDateFilter(start, end, closeDropdown = false) {
  if (!datePill) return;
  const startDate = start ? startOfDay(start) : null;
  const endDate = end ? startOfDay(end) : null;

  currentFilters.date = startDate ? { start: startDate, end: endDate } : null;
  datePill.classList.add('is-applied');

  let label = '';
  if (startDate && endDate) {
    label = `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
  } else if (startDate) {
    label = formatShortDate(startDate);
  } else {
    label = 'Date';
  }

  datePill.innerHTML = `<span>${label}</span><span class="clear-btn" aria-label="Clear filter" role="button"><img class="clear-icon" src="Cross.svg" alt="" /></span>`;
  if (closeDropdown) {
    datePill.classList.remove('is-open');
    document.querySelectorAll('.filter-dropdown').forEach(d => d.remove());
  }

  handleSearch();
}

function renderRowHighlights(gridEl, state) {
  gridEl.querySelectorAll('.calendar-row-highlight').forEach(el => el.remove());
  const range = getActiveRange(state);
  if (!range) return;

  const start = startOfDay(range.start);
  const end = startOfDay(range.end);
  if (isSameDay(start, end)) return;
  const from = start <= end ? start : end;
  const to = start <= end ? end : start;

  const cells = Array.from(gridEl.querySelectorAll('.calendar-cell[data-date]'));
  const rows = new Map();
  cells.forEach(cell => {
    const top = cell.offsetTop;
    const row = rows.get(top) || [];
    row.push(cell);
    rows.set(top, row);
  });

  rows.forEach((rowCells, top) => {
    const rowCellsInRange = rowCells.filter(cell => {
      const date = parseCellDate(cell.getAttribute('data-date'));
      return date >= from && date <= to;
    });
    if (rowCellsInRange.length === 0) return;

    const left = Math.min(...rowCellsInRange.map(c => c.offsetLeft));
    const right = Math.max(...rowCellsInRange.map(c => c.offsetLeft + c.offsetWidth));
    const height = rowCellsInRange[0].offsetHeight;
    const highlight = document.createElement('div');
    highlight.className = 'calendar-row-highlight';
    highlight.style.top = `${top}px`;
    highlight.style.left = `${left}px`;
    highlight.style.width = `${right - left}px`;
    highlight.style.height = `${height}px`;
    gridEl.appendChild(highlight);
  });
}

function getActiveRange(state) {
  if (state.rangeStart && state.rangeEnd) {
    return { start: state.rangeStart, end: state.rangeEnd };
  }
  if (state.rangeStart && state.hoverDate) {
    return { start: state.rangeStart, end: state.hoverDate };
  }
  return null;
}

function parseCellDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return startOfDay(new Date(y, m, d));
}

// Handle load more
function handleLoadMore() {
  loadMoreBtn.style.opacity = '0.5';
  loadMoreBtn.style.pointerEvents = 'none';
  
  setTimeout(() => {
    loadMoreRevealed = true;
    
    handleSearch();
    
    loadMoreBtn.style.opacity = '1';
    loadMoreBtn.style.pointerEvents = 'auto';
  }, 500);
}

// Show no results message
function showNoResults() {
  const empty = document.createElement('div');
  empty.className = 'filter-empty-state is-standard';
  empty.innerHTML = `
    <div class="filter-empty-text">
      <div class="filter-empty-title">No Results Found !</div>
      <div class="filter-empty-subtitle">Check for spellings or search for another query</div>
    </div>
  `;
  scrollArea.appendChild(empty);
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    from {
      transform: scale(0);
      opacity: 1;
    }
    to {
      transform: scale(2);
      opacity: 0;
    }
  }
  
  .item {
    cursor: pointer;
  }
  
  .pill {
    user-select: none;
  }
  
  .filter-dropdown {
    animation: slideDown 0.2s ease;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);
