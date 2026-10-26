
const STORAGE_KEY = "recipeManagementData";

let recipes = loadRecipes();
let currentImage = "";

const recipeForm = document.getElementById("recipeForm");
const recipeId = document.getElementById("recipeId");
const titleInput = document.getElementById("title");
const ingredientsInput = document.getElementById("ingredients");
const instructionsInput = document.getElementById("instructions");
const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("imagePreview");
const recipeList = document.getElementById("recipeList");
const searchInput = document.getElementById("searchInput");
const emptyMessage = document.getElementById("emptyMessage");
const formTitle = document.getElementById("formTitle");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const recipeDialog = document.getElementById("recipeDialog");
const recipeDetails = document.getElementById("recipeDetails");

function loadRecipes() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function saveRecipes() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
        return true;
    } catch {
        alert("Unable to save recipes. The image may be too large. Try a smaller image.");
        return false;
    }
}

function createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function renderRecipes() {
    const query = searchInput.value.trim().toLowerCase();

    const filteredRecipes = recipes.filter(recipe =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.ingredients.toLowerCase().includes(query)
    );

    recipeList.innerHTML = "";

    emptyMessage.style.display =
        filteredRecipes.length === 0 ? "block" : "none";

    filteredRecipes.forEach(recipe => {
        const card = document.createElement("article");
        card.className = "recipe-card";

        const image = document.createElement("img");
        image.src = recipe.image || placeholderImage();
        image.alt = recipe.title;
        image.loading = "lazy";

        const content = document.createElement("div");
        content.className = "recipe-card-content";

        const heading = document.createElement("h3");
        heading.textContent = recipe.title;

        const description = document.createElement("p");
        description.textContent =
            recipe.ingredients.length > 100
                ? recipe.ingredients.slice(0, 100) + "..."
                : recipe.ingredients;

        const buttons = document.createElement("div");
        buttons.className = "card-buttons";

        buttons.append(
            createButton("View", () => viewRecipe(recipe.id)),
            createButton("Edit", () => editRecipe(recipe.id)),
            createButton("Delete", () => deleteRecipe(recipe.id), "delete")
        );

        content.append(heading, description, buttons);
        card.append(image, content);
        recipeList.appendChild(card);
    });
}

function placeholderImage() {
    return "data:image/svg+xml," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">' +
        '<rect width="100%" height="100%" fill="#e5eee5"/>' +
        '<text x="50%" y="50%" text-anchor="middle" fill="#276749" font-size="22">Recipe</text>' +
        '</svg>'
    );
}

function createButton(text, action, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;

    if (className) {
        button.className = className;
    }

    button.addEventListener("click", action);
    return button;
}

function resetForm() {
    recipeForm.reset();
    recipeId.value = "";
    currentImage = "";
    imagePreview.src = "";
    imagePreview.hidden = true;
    formTitle.textContent = "Add New Recipe";
    saveButton.textContent = "Add Recipe";
    cancelButton.hidden = true;
}

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        imageInput.value = "";
        return;
    }

    const maxSize = 1 * 1024 * 1024;

    if (file.size > maxSize) {
        alert("Please select an image smaller than 1 MB.");
        imageInput.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = event => {
        currentImage = event.target.result;
        imagePreview.src = currentImage;
        imagePreview.hidden = false;
    };

    reader.onerror = () => {
        alert("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
});

recipeForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const ingredients = ingredientsInput.value.trim();
    const instructions = instructionsInput.value.trim();

    if (!title || !ingredients || !instructions) {
        alert("Please fill in all required fields.");
        return;
    }

    const editingId = recipeId.value;

    const existingRecipe = editingId
        ? recipes.find(recipe => recipe.id === editingId)
        : null;

    if (editingId && !existingRecipe) {
        alert("Recipe not found. Please try again.");
        resetForm();
        return;
    }

    const recipe = {
        id: editingId || createId(),
        title,
        ingredients,
        instructions,
        image: currentImage || existingRecipe?.image || ""
    };

    const previousRecipes = [...recipes];

    if (editingId) {
        recipes = recipes.map(item =>
            item.id === editingId ? recipe : item
        );
    } else {
        recipes.unshift(recipe);
    }

    if (!saveRecipes()) {
        recipes = previousRecipes;
        return;
    }

    resetForm();
    renderRecipes();
    alert(editingId ? "Recipe updated successfully!" : "Recipe added successfully!");
});

function viewRecipe(id) {
    const recipe = recipes.find(item => item.id === id);

    if (!recipe) {
        return;
    }

    recipeDetails.innerHTML = `
        <h2>${escapeHTML(recipe.title)}</h2>
        <img src="${recipe.image || placeholderImage()}"
             alt="${escapeHTML(recipe.title)}">
        <h3>Ingredients</h3>
        <p>${escapeHTML(recipe.ingredients)}</p>
        <h3>Instructions</h3>
        <p>${escapeHTML(recipe.instructions)}</p>
    `;

    recipeDialog.showModal();
}

function editRecipe(id) {
    const recipe = recipes.find(item => item.id === id);

    if (!recipe) {
        return;
    }

    recipeId.value = recipe.id;
    titleInput.value = recipe.title;
    ingredientsInput.value = recipe.ingredients;
    instructionsInput.value = recipe.instructions;

    currentImage = recipe.image || "";
    imagePreview.hidden = !currentImage;

    if (currentImage) {
        imagePreview.src = currentImage;
    }

    formTitle.textContent = "Edit Recipe";
    saveButton.textContent = "Update Recipe";
    cancelButton.hidden = false;

    recipeForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function deleteRecipe(id) {
    const recipe = recipes.find(item => item.id === id);

    if (!recipe) {
        return;
    }

    if (!confirm(`Are you sure you want to delete "${recipe.title}"?`)) {
        return;
    }

    const previousRecipes = [...recipes];
    recipes = recipes.filter(item => item.id !== id);

    if (!saveRecipes()) {
        recipes = previousRecipes;
        return;
    }

    if (recipeId.value === id) {
        resetForm();
    }

    renderRecipes();
}

cancelButton.addEventListener("click", resetForm);

searchInput.addEventListener("input", renderRecipes);

document.getElementById("closeDialog").addEventListener("click", () => {
    recipeDialog.close();
});

recipeDialog.addEventListener("click", event => {
    if (event.target === recipeDialog) {
        recipeDialog.close();
    }
});

renderRecipes();
