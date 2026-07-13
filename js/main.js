document.addEventListener('DOMContentLoaded', async () => {
  const map = L.map('map').setView([51.73, 36.19], 8);

  // Базовая карта
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const layers = {}; // хранилище объектов слоёв Leaflet

  // 1. Загружаем конфигурацию меню из layers.json
  const config = await fetch('layers.json').then(r => r.json());

  const menuContainer = document.getElementById('menu-container');

  // 2. Строим меню из JSON
  config.forEach(group => {
    const groupEl = document.createElement('div');
    groupEl.className = 'menu-group';

    const titleEl = document.createElement('span');
    titleEl.className = 'menu-group-title';
    titleEl.textContent = group.group;
    groupEl.appendChild(titleEl);

    const itemsEl = document.createElement('div');
    itemsEl.className = 'menu-items';

    group.items.forEach(item => {
      const label = document.createElement('label');
      label.className = 'menu-item-label';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = item.visible ?? true;
      cb.dataset.key = item.key;

      label.appendChild(cb);
      label.appendChild(document.createTextNode(item.name));

      itemsEl.appendChild(label);
    });

    groupEl.appendChild(itemsEl);
    menuContainer.appendChild(groupEl);

    // 3. Логика «выезжания» подпунктов при клике на заголовок
    titleEl.addEventListener('click', () => {
      itemsEl.classList.toggle('open');
    });
  });

  // 4. Загрузка GeoJSON и добавление на карту
  const loadGeoJson = async (file, key, style) => {
    try {
      const data = await fetch(`data/${file}`).then(r => r.json());
      const layer = L.geoJSON(data, { style }).addTo(map);
      layers[key] = layer;
    } catch (e) {
      console.error('Ошибка загрузки слоя:', file, e);
    }
  };

  config.forEach(group => {
    group.items.forEach(item => {
      if (!item.file) return;

      const style = {
        color: item.color || '#000000',
        weight: item.weight || 2,
      };
      if (item.dashArray) style.dashArray = item.dashArray;

      loadGeoJson(item.file, item.key, style);
    });
  });

  // 5. Обработка чекбоксов (включить/выключить слой)
  document.querySelectorAll('#menu-container input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const key = e.target.dataset.key;
      const layer = layers[key];
      if (!layer) return;

      if (e.target.checked) {
        map.addLayer(layer);
      } else {
        map.removeLayer(layer);
      }
    });
  });
});
