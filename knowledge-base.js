$(document).ready(function () {
	$('select').niceSelect();
});

const BACKEND_URL = 'https://beta-backend-7ikj4ovbfa-uc.a.run.app/api/v1';

// Support functions
function isDescriptionInDocs(docs, description) {
	return docs.some((doc) => doc.category?.description?.pt === description.pt);
}

function activateDocButtons(docs, activity_descriptions) {
	$('.org-button').click(function () {
		const urlParams = new URLSearchParams(window.location.search);
		const org_id = urlParams.get('org_id');
		window.location.href = `/org?org_id=${org_id}`;
	});

	$('.doc-button').click(async function () {
		// Remove temporary buttons
		$('.temp').remove();

		$(this).addClass('selected').siblings().removeClass('selected');

		const doc_index = parseInt($(this).attr('id'));

		doc = docs[doc_index];

		$('#dashboard-placeholder').hide();
		$('#doc-form-wrapper').fadeIn();

		switch (doc.category.name) {
			case 'product':
			case 'service':
				$('#dashboard-heading').text('Editar produto/serviço');
				$('#activity_descriptions-select').hide();

				$('.product-service-grid').fadeIn();
				$('.other-grid').hide();

				// Populate product/service data
				$('#item-name').val(doc.name);
				$('#item-price').val(doc.price);
				$(`input[name="pricing-model"][value="${doc.pricing_model}"]`).prop('checked', true);
				$(`input[name="category"][value="${doc.category.name}"]`).prop('checked', true);
				break;
			case 'other':
				$('#activity_descriptions-select').fadeIn();

				// Populate activity_descriptions
				$('.list:first').empty();

				// Iterate through activity_descriptions and append if not in docs
				activity_descriptions.forEach((description, index) => {
					if (!isDescriptionInDocs(docs, description)) {
						let listItem = `<li class="option description truncate">${description.pt}</li>`;
						$('.list:first').append(listItem);
					}
				});

				// Prepend selected option
				$('.list:first').prepend(
					`<li class="option description truncate selected">${
						doc?.category?.description?.pt || ''
					}</li>`
				);

				// Update the selected option
				$('.current:first').text(doc?.category?.description?.pt || 'Selecione um assunto');

				// Check if doc.category.name is appointment
				if (doc.category.name === 'appointment') {
					$('#dashboard-heading').text('Editar agendamento');
					$('.description-block').css('display', 'none');
					$('.appointment-block').css('display', 'block');
					$('#appointment').val(doc.link);
				} else {
					$('#dashboard-heading').text('Editar conteúdo');
					$('.description-block').css('display', 'block');
					$('.appointment-block').css('display', 'none');
					$('#description').val(doc.description);
				}

				$('.product-service-grid').hide();
				$('.other-grid').fadeIn();
				break;
		}

		// Populate description
		$('#description').val(doc.description);
	});
}

function resetDocs(
	docs,
	activity_descriptions,
	docs_list_id = $('.tab-link.w--current').attr('id')
) {
	$('#save-doc').val('Salvar conteúdo');
	$('#doc-form-wrapper').hide();
	$('#dashboard-placeholder').css('display', 'flex');
	$('#doc-form').trigger('reset');
	$('#doc-list').empty();
	$('#doc-list').hide();

	let filtered_docs = docs.map((doc, index) => ({ ...doc, index }));

	// Filter products and services
	if (docs_list_id === 'products-services') {
		filtered_docs = filtered_docs.filter(
			(doc) => doc?.category?.name === 'product' || doc?.category?.name === 'service'
		);
	}

	// Filter others
	if (docs_list_id === 'others') {
		filtered_docs = filtered_docs.filter(
			(doc) => doc?.category?.name === 'other' || doc?.category?.name === 'appointment'
		);
	}

	if (filtered_docs.length < 1) {
		$('#doc-list').append(`<div class="doc-button disabled temp">Nenhum conteúdo cadastrado</div>`);
	} else {
		filtered_docs.forEach((doc, index) => {
			let doc_icon = '';

			switch (doc?.category?.name) {
				case 'product':
					doc_icon =
						'https://uploads-ssl.webflow.com/64773d761bc76753239357f0/64f093a6c377542181aac259_cube.svg';
					break;
				case 'service':
					doc_icon =
						'https://uploads-ssl.webflow.com/64773d761bc76753239357f0/64f0d48ef824837f11d1d675_map.svg';
					break;
				case 'other':
					doc_icon =
						'https://uploads-ssl.webflow.com/64773d761bc76753239357f0/64f09488f55de927379dee60_document.svg';
					break;
				case 'appointment':
					doc_icon =
						'https://uploads-ssl.webflow.com/64773d761bc76753239357f0/64f0961f765d8fd565af3634_calendar.svg';
					break;
				default:
					doc_icon =
						'https://uploads-ssl.webflow.com/64773d761bc76753239357f0/64f09488f55de927379dee60_document.svg';
					break;
			}
			$('#doc-list').append(
				`<div class="doc-button" id="${doc.index.toString()}"><img src="${doc_icon}" loading="eager" alt="" class="doc-icon"><div class="truncate">${
					doc.name
						? doc.name
						: doc?.category?.description?.pt
						? doc?.category?.description?.pt
						: 'Documento'
				}</div></div>`
			);
		});
	}
	$('#doc-list').fadeIn();

	activateDocButtons(docs, activity_descriptions);
}

// Handle page actions
$(document).ready(async function () {
	// Get data to display
	const urlParams = new URLSearchParams(window.location.search);
	const unit_id = urlParams.get('unit_id');
	const org_id = urlParams.get('org_id');
	const fb_token = Cookies.get('fb_token');
	let response;
	let org;
	let activity_descriptions;

	// Get org data
	try {
		response = await fetch(`${BACKEND_URL}/docs?org_id=${org_id}&unit_id=${unit_id}`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${fb_token}` },
		});
		if (!response.ok) throw new Error('Unable to fetch data');
		org = await response.json();
	} catch (error) {
		window.location.replace('/my-business');
	}

	let docs = org.docs;

	// Get activities by ID
	try {
		response = await fetch(
			`${BACKEND_URL}/industries?industry_id=${org.industry.toString()}&activity_id=${org.activity.toString()}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${fb_token}` },
			}
		);
		if (!response.ok) throw new Error('Unable to fetch data');
		activity_descriptions = await response.json();
	} catch (error) {
		window.location.replace('/my-business');
	}

	// Populate organization section
	$('#org-name').text(org.name);
	$('#unit-address').text(org.unit_address);
	$('.org-section').fadeIn();

	resetDocs(docs, activity_descriptions);

	$('#activity-description').change(function () {
		$('#description').val('');
		$('#appointment').val('');

		const APPOINTMENT_LABELS = ['Datas e horários disponíveis para reservas/agendamentos'];

		if (APPOINTMENT_LABELS.includes($('.current:first').text())) {
			$('.description-block').css('display', 'none');
			$('.appointment-block').css('display', 'block');
		} else {
			$('.description-block').css('display', 'block');
			$('.appointment-block').css('display', 'none');
		}
	});

	$('.tab-link').click(function () {
		$('#doc-form-wrapper').hide();
		$('#dashboard-placeholder').css('display', 'flex');
		$('#save-doc').val('Salvar conteúdo');
		$('#doc-form').trigger('reset');

		switch ($(this).attr('id')) {
			case 'products-services':
				$('#btn-add-text').text('Cadastrar produto ou serviço');
				break;
			default:
				$('#btn-add-text').text('Cadastrar conteúdo');
				break;
		}

		resetDocs(docs, activity_descriptions, $(this).attr('id'));
	});

	$('.add-doc').click(function () {
		// Remove temporary buttons
		$('.temp').remove();
		$('#doc-form').trigger('reset');

		// Reset content
		$('#dashboard-placeholder').hide();
		$('#doc-form-wrapper').fadeIn();

		// Reset content input
		$('.description-block').css('display', 'block');
		$('.appointment-block').css('display', 'none');

		// Add new doc button
		$('#doc-list').prepend(`<div class="doc-button selected truncate temp">Novo conteúdo</div>`);

		// Populate activity_descriptions
		$('.list:first').empty();
		if ($('.tab-link.w--current').attr('id') === 'products-services') {
			$('#single').prop('checked', true);
			$('#product').prop('checked', true);
		}

		// Get selected tab
		const docs_list_id = $('.tab-link.w--current').attr('id');

		if (docs_list_id === 'products-services') {
			$('#dashboard-heading').text('Cadastrar novo produto/serviço');
			$('#activity_descriptions-select').hide();

			$('.product-service-grid').fadeIn();
			$('.other-grid').hide();
		}

		if (docs_list_id === 'others') {
			// Update heading
			$('#dashboard-heading').text('Cadastrar novo conteúdo');
			$('#activity_descriptions-select').fadeIn();

			$('.product-service-grid').hide();
			$('.other-grid').fadeIn();

			// Iterate through activity_descriptions and append if not in docs
			activity_descriptions.forEach((description, index) => {
				if (!isDescriptionInDocs(docs, description)) {
					let listItem = `<li class="option description truncate">${description.pt}</li>`;
					$('.list:first').append(listItem);
				}
			});
		}

		$('.current:first').text('Selecione um assunto');

		// Reset button event listeners
		$('.doc-button').off('click');

		// Add event listener to new button
		activateDocButtons(docs, activity_descriptions);

		// Make button selected
		$('.doc-button').removeClass('selected');
		$('.doc-button:first').addClass('selected');
	});

	$('#save-doc').click(async function (event) {
		event.preventDefault();
		let activity_description_data;
		let category_name = '';

		$('#save-doc').val('Salvando...');

		const activity_description_pt = $('li.description.selected').text();
		const docs_list_id = $('.tab-link.w--current').attr('id');

		// Validate fields
		if (!$('#description').val() && !$('#appointment').val()) {
			alert('Preencha todos os campos!');
			$('#save-doc').val('Salvar conteúdo');
			return;
		}

		switch (docs_list_id) {
			case 'products-services':
				if ($('input[name="category"]:checked').val() === 'product') {
					category_name = 'product';
				} else {
					category_name = 'service';
				}
				break;
			case 'others':
				// Get corresponding activity_description from activity_descriptions
				activity_description_data = activity_descriptions.find(
					(description) => description.pt === activity_description_pt
				);

				delete activity_description_data._id;

				if (!activity_description_data) {
					alert('Por favor, selecione um assunto!');
					$('#save-doc').val('Salvar conteúdo');
					return;
				}
				if ($('#appointment').val()) {
					category_name = 'appointment';
				} else {
					category_name = 'other';
				}
				break;
			default:
				alert('Desculpe, houve um erro ao salvar o documento. Tente novamente mais tarde.');
				$('#save-doc').val('Salvar conteúdo');
				break;
		}

		const new_doc = {
			index: $('.doc-button.selected').attr('id')
				? parseInt($('.doc-button.selected').attr('id'))
				: docs.length + 1,
			category: {
				name: category_name,
				description: activity_description_data,
			},
			link: category_name === 'appointment' ? $('#appointment').val() || undefined : undefined,
			description:
				category_name === 'appointment' ? undefined : $('#description').val() || undefined,
			name:
				category_name === 'product' || category_name === 'service'
					? $('#item-name').val() || undefined
					: undefined,
			pricing_model: $('input[name="pricing-model"]:checked').val() || undefined,
			price:
				category_name === 'product' || category_name === 'service'
					? $('#item-price').val() || undefined
					: undefined,
			currency: 'BRL',
		};

		try {
			response = await fetch(`${BACKEND_URL}/docs?org_id=${org_id}&unit_id=${unit_id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${fb_token}`,
				},
				body: JSON.stringify(new_doc),
			});
			if (!response.ok) {
				throw new Error('Network response was not ok');
			} else {
				docs = await response.json();
				resetDocs(docs, activity_descriptions);
			}
		} catch (error) {
			alert('Desculpe, houve um erro ao salvar o documento. Tente novamente mais tarde.');
			$('#save-doc').val('Salvar conteúdo');
		}
	});

	$('#confirm-delete-button').click(async function (event) {
		event.preventDefault();
		let index = $('.doc-button.selected').attr('id');

		if (typeof index == 'undefined' || isNaN(index)) {
			resetDocs(docs, activity_descriptions);
			return;
		} else {
			index = parseInt(index);
		}

		$('#delete-button').text('Excluindo...');

		try {
			response = await fetch(`${BACKEND_URL}/docs?org_id=${org_id}&unit_id=${unit_id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${fb_token}`,
				},
				body: JSON.stringify({ index }),
			});
			if (!response.ok) {
				throw new Error('Network response was not ok');
			} else {
				$('#delete-button').text('Excluir');
				docs = await response.json();
				resetDocs(docs, activity_descriptions);
			}
		} catch (error) {
			if (alert('Desculpe, houve um erro ao deletar o documento. Tente novamente mais tarde.')) {
				location.reload();
				$('#delete-button').text('Excluir');
			}
		}
	});
});
