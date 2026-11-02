
import customtkinter as ctk

# Application appearance
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")


class NeonWave(ctk.CTk):

    def show_page(self, page_name):

        page_colors = {
            "Home": "#E9DFC9",
            "Discover": "#DCE8E9",
            "Library": "#E5E0F0",
            "Liked Songs": "#F0DCE5",
            "Playlists": "#E2E9DC"
        }

        self.page_title.configure(text=page_name)

        self.content.configure(
            fg_color=page_colors[page_name]
        )

    def __init__(self):
        super().__init__()

        # Main window settings
        self.title("NeonWave")
        self.geometry("1200x750")
        self.minsize(950, 600)

        self.configure(fg_color="#111719")

        # Main container
        self.main_container = ctk.CTkFrame(
            self,
            fg_color="transparent"
        )

        self.main_container.pack(
            fill="both",
            expand=True,
            padx=15,
            pady=15
        )

        # Sidebar
        self.sidebar = ctk.CTkFrame(
            self.main_container,
            width=220,
            fg_color="#171E20",
            corner_radius=16
        )

        self.sidebar.pack(
            side="left",
            fill="y",
            padx=(0, 12)
        )

        self.sidebar.pack_propagate(False)

        # Logo
        self.logo = ctk.CTkLabel(
            self.sidebar,
            text="NEONWAVE",
            font=("Arial", 23, "bold"),
            text_color="#D69A45"
        )

        self.logo.pack(pady=(30, 35))

        # Navigation heading
        self.nav_heading = ctk.CTkLabel(
            self.sidebar,
            text="MENU",
            text_color="#829092",
            font=("Arial", 11, "bold")
        )

        self.nav_heading.pack(
            pady=(20, 10),
            anchor="w",
            padx=20
        )

        # Navigation buttons
        pages = [
            "Home",
            "Discover",
            "Library",
            "Liked Songs",
            "Playlists"
        ]

        for page in pages:

            button = ctk.CTkButton(
                self.sidebar,
                text=page,
                fg_color="transparent",
                hover_color="#303B3D",
                text_color="#F5F1E8",
                font=("Arial", 13, "bold"),
                anchor="w",
                command=lambda name=page: self.show_page(name)
            )

            button.pack(
                fill="x",
                padx=12,
                pady=3
            )

        # Content frame
        self.content = ctk.CTkFrame(
            self.main_container,
            fg_color="#E9DFC9",
            corner_radius=15
        )

        self.content.pack(
            side="right",
            fill="both",
            expand=True
        )

        # Page title
        self.page_title = ctk.CTkLabel(
            self.content,
            text="Home",
            font=("Arial", 28, "bold"),
            text_color="#171E20"
        )

        self.page_title.pack(
            anchor="w",
            padx=30,
            pady=30
        )


        # Home screen container
        self.home_section = ctk.CTkFrame(
            self.content,
            fg_color="transparent"
        )

        self.home_section.pack(
            fill="both",
            expand=True,
            padx=25,
            pady=(0, 20)
        )

        #Left music section
        self.music_section = ctk.CTkFrame(
            self.home_section,
            fg_color="#202729",
            corner_radius=15,
            width=350
        )
        self.music_section.pack(
            # side="left",
            # fill="both",
            expand=True,
            padx=(0, 10)
        )

        # Music section heading
        self.music_heading = ctk.CTkLabel(
            self.music_section,
            text="A side",
            font=("Arial", 35, "bold"),
            text_color="#F5F1E8"
        )

        self.music_heading.pack(
            anchor="w",
            padx=25,
            pady=(25, 5)
        )

        self.music_subheading = ctk.CTkLabel(
            self.music_section,
            text="YOUR MUSIC COLLECTION",
            font=("Arial", 10, "bold"),
            text_color="#829092"
        )

        self.music_subheading.pack(
            anchor="w",
            padx=25,
            pady=(0, 25)
        )


# Run application
if __name__ == "__main__":
    app = NeonWave()
    app.mainloop()
