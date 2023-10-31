let lat;
let lng;
let map;
let markers = [];

function initMap(lat = -23.543228744218986, lng = -46.64185219146712) {
	var customMapStyle = [
		{
			elementType: 'geometry',
			stylers: [
				{
					color: '#36475c',
				},
			],
		},
		{
			elementType: 'labels.text.fill',
			stylers: [
				{
					color: '#ffffff',
				},
			],
		},
		{
			elementType: 'labels.text.stroke',
			stylers: [
				{
					color: '#000000',
				},
				{
					weight: 1,
				},
			],
		},
		{
			featureType: 'administrative.locality',
			elementType: 'labels.text.fill',
			stylers: [
				{
					color: '#e1e1e1',
				},
			],
		},
		{
			featureType: 'road',
			elementType: 'geometry',
			stylers: [
				{
					color: '#2e394b',
				},
			],
		},
		{
			featureType: 'road',
			elementType: 'geometry.stroke',
			stylers: [
				{
					color: '#212a37',
				},
			],
		},
		{
			featureType: 'road',
			elementType: 'labels.text.fill',
			stylers: [
				{
					color: '#ffffff',
				},
			],
		},
		{
			featureType: 'road.arterial',
			elementType: 'geometry',
			stylers: [
				{
					color: '#485a6f',
				},
			],
		},
		{
			featureType: 'road.arterial',
			elementType: 'labels.text.fill',
			stylers: [
				{
					color: '#ffffff',
				},
			],
		},
		{
			featureType: 'road.highway',
			elementType: 'geometry',
			stylers: [
				{
					color: '#717c9f',
				},
			],
		},
		{
			featureType: 'road.highway',
			elementType: 'geometry.stroke',
			stylers: [
				{
					color: '#1f2835',
				},
			],
		},
		{
			featureType: 'road.highway',
			elementType: 'labels.text.fill',
			stylers: [
				{
					color: '#ffffff',
				},
			],
		},
		{
			featureType: 'poi',
			elementType: 'labels',
			stylers: [
				{
					visibility: 'off',
				},
			],
		},
		{
			featureType: 'poi.park',
			elementType: 'geometry',
			stylers: [
				{
					hue: '#075E54',
				},
			],
		},
		{
			featureType: 'poi.park',
			elementType: 'labels.icon',
			stylers: [
				{
					visibility: 'on',
				},
			],
		},
		{
			featureType: 'poi.park',
			elementType: 'labels.text',
			stylers: [
				{
					visibility: 'on',
				},
			],
		},
		{
			featureType: 'transit',
			elementType: 'geometry',
			stylers: [
				{
					color: '#5b6b80',
				},
			],
		},
		{
			featureType: 'transit.station',
			elementType: 'labels.text.fill',
			stylers: [
				{
					color: '#e1e1e1',
				},
			],
		},
		{
			featureType: 'water',
			elementType: 'geometry',
			stylers: [
				{
					color: '#1e3579',
				},
			],
		},
		{
			featureType: 'water',
			elementType: 'labels.text.fill',
			stylers: [
				{
					color: '#ffffff',
				},
			],
		},
		{
			featureType: 'water',
			elementType: 'labels.text.stroke',
			stylers: [
				{
					color: '#000000',
				},
				{
					weight: 1,
				},
			],
		},
	];

	// Map options
	var options = {
		zoom: 15,
		center: { lat, lng },
		styles: customMapStyle,
		mapTypeControl: false,
	};

	map = new google.maps.Map(document.getElementById('map'), options);

	// Add user marker
	var marker = new google.maps.Marker({
		map: map,
		icon: 'https://uploads-ssl.webflow.com/64773d761bc76753239357f0/6504650323fbdfa3e6f51a95_1.png',
		position: { lat, lng },
	});

	$('#typing').hide();
}

function addMarkerEventListeners(marker, name, infoWindow, link) {
	marker.addListener('click', function () {
		window.open(link, '_blank');
	});

	marker.addListener('mouseover', function () {
		var contentString =
			'<div style="background: #fff; border-radius: 4px; color: #000; font-size: 14px; font-weight: 400; font-family: Outfit, sans-serif"><strong>' +
			name +
			'</strong><br></div>';

		infoWindow.setContent(contentString);

		// Disable automatic panning and hide the close button using CSS
		infoWindow.setOptions({ disableAutoPan: true });

		infoWindow.open(map, marker);
	});

	marker.addListener('mouseout', function () {
		infoWindow.close();
	});
}

async function addMarkersWithTimeout(markersData) {
	var bounds = new google.maps.LatLngBounds();
	var infoWindow = new google.maps.InfoWindow();
	var maxZoomLevel = 16;
	const delay = 200; // Delay between marker animations

	async function addMarkerWithTimeout(markerData) {
		const customMarkerIcon = {
			url:
				markerData.type === 'pro'
					? 'https://uploads-ssl.webflow.com/64773d761bc76753239357f0/6512d7b753a6e28933580111_beta-marker.png'
					: markerData.type === 'suggested'
					? 'https://uploads-ssl.webflow.com/64773d761bc76753239357f0/6512d7b7d55191dd0668307c_suggested-marker.png'
					: 'https://uploads-ssl.webflow.com/64773d761bc76753239357f0/6512d7b7546eeb847100023a_basic-marker.png',
		};

		return new Promise((resolve) => {
			setTimeout(() => {
				const marker = new google.maps.Marker({
					map: map,
					icon: customMarkerIcon,
					position: { lat: markerData.location.lat, lng: markerData.location.lng },
					animation: google.maps.Animation.DROP,
				});

				bounds.extend(marker.getPosition());
				addMarkerEventListeners(marker, markerData.name, infoWindow, markerData.link);

				markers.push(marker);

				resolve();
			}, delay);
		});
	}

	await Promise.all(markersData.map(addMarkerWithTimeout));

	map.fitBounds(bounds);
	google.maps.event.addListenerOnce(map, 'bounds_changed', function () {
		if (map.getZoom() > maxZoomLevel) {
			map.setZoom(maxZoomLevel);
		}
	});
}

function clearMarkers() {
	for (let i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}

	markers = [];
}

function removeDuplicateMarkers(markers) {
	const uniqueMarkers = [];
	const markerLocations = new Map();

	for (const marker of markers) {
		const key = marker.location.lat.toFixed(6) + ',' + marker.location.lng.toFixed(6);

		if (!markerLocations.has(key)) {
			markerLocations.set(key, true);
			uniqueMarkers.push(marker);
		}
	}

	return uniqueMarkers;
}

// Check if the Geolocation API is available in the browser
if ('geolocation' in navigator) {
	navigator.geolocation.getCurrentPosition(function (position) {
		lat = position.coords.latitude;
		lng = position.coords.longitude;

		initMap(lat, lng);

		$('#message-input').prop('disabled', false);
	});
} else {
	console.log('Geolocation is not available in this browser.');
}
