$(document).ready(function () {
	$('select').niceSelect();
});

const BACKEND_URL = 'https://beta-backend-7ikj4ovbfa-uc.a.run.app/api/v1';

// Support functions
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
				$('#dashboard-heading').text('Editar produto');
				$('#activity_descriptions-select').hide();

				$('.product-grid').fadeIn();
				$('.service-grid').hide();
				$('.other-grid').hide();

				// Populate product data
				$('#product-name').val(doc.name);
				$('#product-price').val(doc.price);
				break;
			case 'service':
				$('#dashboard-heading').text('Editar serviço');
				$('#activity_descriptions-select').hide();

				$('.product-grid').hide();
				$('.service-grid').fadeIn();
				$('.other-grid').hide();

				// Populate service data
				$('#service-name').val(doc.name);
				$('#service-price').val(doc.price);
				$(`input[name="model-price"][value="${doc.model_price}"]`).prop('checked', true);
				break;
			case 'other':
				$('#activity_descriptions-select').fadeIn();

				// Populate activity_descriptions
				$('.list:first').empty();

				for (let i = 0; i < activity_descriptions.length; i++) {
					// Append if the current index is not in the docs array
					if (!docs.find((doc) => doc.activity_description_index === i)) {
						$('.list:first').append(
							`<li data-value="${i}" class="option description truncate">${activity_descriptions[i].pt}</li>`
						);
					}
				}

				// Append selected option
				$('.list:first').append(
					`<li data-value="${
						doc.activity_description_index
					}" class="option description truncate selected">${
						activity_descriptions[doc.activity_description_index].pt
					}</li>`
				);

				// Update the selected option
				const option = activity_descriptions[doc.activity_description_index].pt;
				$('.current:first').text(option);

				// Set the option value
				$('li.option.activity-description').click(function () {
					const value = $(this).attr('data-value');
					$('#description-index').val(value);
				});

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

				$('.product-grid').hide();
				$('.service-grid').hide();
				$('.other-grid').fadeIn();
				break;
		}

		// Populate description
		$('#doc-description').val(doc.description);
	});
}

function resetDocs(docs, activity_descriptions, docs_list_id = 'products') {
	let empty_text = 'Nenhum produto cadastrado';

	$('#save-doc').val('Salvar conteúdo');
	$('#doc-form-wrapper').hide();
	$('#dashboard-placeholder').css('display', 'flex');
	$('#doc-form').trigger('reset');
	$('#doc-list').empty();
	$('#doc-list').hide();

	let filtered_docs = docs.map((doc, index) => ({ ...doc, index }));

	// Filter products (activity_description_index = 0)
	if (docs_list_id === 'products') {
		filtered_docs = filtered_docs.filter((doc) => doc.category.name === 'product');
		empty_text = 'Nenhum produto cadastrado';
	}

	// Filter services (activity_description_index = 1)
	if (docs_list_id === 'services') {
		filtered_docs = filtered_docs.filter((doc) => doc.category.name === 'service');
		empty_text = 'Nenhum serviço cadastrado';
	}

	// Filter others (activity_description_index > 1)
	if (docs_list_id === 'others') {
		filtered_docs = filtered_docs.filter(
			(doc) => doc.category.name === 'other' || doc.category.name === 'appointment'
		);
		empty_text = 'Nenhum conteúdo cadastrado';
	}

	if (filtered_docs.length < 1) {
		$('#doc-list').append(`<div class="doc-button disabled temp">${empty_text}</div>`);
	} else {
		filtered_docs.forEach((doc, index) => {
			$('#doc-list').append(
				`<div class="doc-button" id="${doc.index.toString()}"><img src="https://uploads-ssl.webflow.com/64773d761bc76753239357f0/64b3ee5171c9469766a2c07f_document.svg" loading="eager" alt="" class="doc-icon"><div class="truncate">${
					doc.name ? doc.name : 'Sem título'
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

		// Get tab ID
		const docs_list_id = $(this).attr('id');

		switch (docs_list_id) {
			case 'products':
				$('#btn-add-text').text('Cadastrar produto');
				break;
			case 'services':
				$('#btn-add-text').text('Cadastrar serviço');
				break;
			default:
				$('#btn-add-text').text('Cadastrar conteúdo');
				break;
		}

		resetDocs(docs, activity_descriptions, docs_list_id);
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

		// Get selected tab
		const docs_list_id = $('.tab-link.w--current').attr('id');

		if (docs_list_id === 'products') {
			$('#dashboard-heading').text('Cadastrar novo produto');
			$('#activity_descriptions-select').hide();

			$('.product-grid').fadeIn();
			$('.service-grid').hide();
			$('.other-grid').hide();
		}

		if (docs_list_id === 'services') {
			// Update heading
			$('#dashboard-heading').text('Cadastrar novo serviço');
			$('#activity_descriptions-select').hide();

			$('.product-grid').hide();
			$('.service-grid').fadeIn();
			$('.other-grid').hide();
		}

		if (docs_list_id === 'others') {
			// Update heading
			$('#dashboard-heading').text('Cadastrar novo conteúdo');
			$('#activity_descriptions-select').fadeIn();

			$('.product-grid').hide();
			$('.service-grid').hide();
			$('.other-grid').fadeIn();

			// Populate activity_descriptions
			for (let i = 0; i < activity_descriptions.length; i++) {
				// Append if the current index is not in the docs array
				if (!docs.find((doc) => doc.activity_description_index === i) && i !== 0 && i !== 1) {
					$('.list:first').append(
						`<li data-value="${i}" class="option description truncate">${activity_descriptions[i].pt}</li>`
					);
				}
			}
		}

		$('.current:first').text('Selecione um assunto');

		// Reset button event listeners
		$('.doc-button').off('click');

		// Add event listener to new button
		activateDocButtons(docs, activity_descriptions);

		// Make button selected
		$(`#${docs.length + 1}`)
			.addClass('selected')
			.siblings()
			.removeClass('selected');
	});

	$('#save-doc').click(async function (event) {
		event.preventDefault();
		let activity_description_data;
		let category_name = '';

		$('#save-doc').val('Salvando...');

		const activity_description = $('li.selected.activity-description').data('value');

		// Validate fields
		if (!$('#description').val() && !$('#appointment').val()) {
			alert('Preencha todos os campos!');
			$('#save-doc').val('Salvar conteúdo');
			return;
		} else {
			// Get corresponding activity_description from activity_descriptions
			activity_description_data = activity_descriptions.find(
				(description) => description.pt === activity_description
			);
		}

		const docs_list_id = $('.tab-link.w--current').attr('id');

		switch (docs_list_id) {
			case 'products':
				category_name = 'product';
				break;
			case 'services':
				category_name = 'service';
				break;
			case 'others':
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
				description: activity_description_data
					? {
							en: activity_description_data ? activity_description_data.en : undefined,
							pt: activity_description_data ? activity_description_data.pt : undefined,
					  }
					: undefined,
			},
			link: category_name === 'appointment' ? $('#appointment').val() : undefined,
			description: category_name === 'appointment' ? undefined : $('#description').val(),
			name:
				category_name === 'product'
					? $('#product-name').val()
					: category_name === 'service'
					? $('#service-name').val()
					: undefined,
			model_price: $('input[name="model-price"]:checked').val(),
			price:
				category_name === 'product'
					? $('#product-price').val()
					: category_name === 'service'
					? $('#service-price').val()
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

		$('#delete-button').text('Deletando...');

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
				$('#delete-button').text('Deletar');
				docs = await response.json();
				resetDocs(docs, activity_descriptions);
			}
		} catch (error) {
			if (alert('Desculpe, houve um erro ao deletar o documento. Tente novamente mais tarde.')) {
				location.reload();
				$('#delete-button').text('Deletar documento');
			}
		}
	});
});
