from django.urls import path

from . import views

app_name = "catalog"

urlpatterns = [
    # categories
    path("categories/", views.CategoryListCreateView.as_view(), name="category-list"),
    path("categories/<int:pk>/", views.CategoryDetailView.as_view(), name="category-detail"),

    # products
    path("products/", views.ProductListCreateView.as_view(), name="product-list"),
    path("products/<int:pk>/", views.ProductDetailView.as_view(), name="product-detail"),
    path("products/<int:pk>/compare/", views.ProductCompareView.as_view(), name="product-compare"),

    # listings
    path("listings/", views.ListingListCreateView.as_view(), name="listing-list"),
    path("listings/mine/", views.MyListingsView.as_view(), name="my-listings"),
    path("listings/<int:pk>/", views.ListingDetailView.as_view(), name="listing-detail"),
]
